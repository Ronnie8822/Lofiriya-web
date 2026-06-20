import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { UserData } from "../models/UserData";
import { ActivityLog } from "../models/ActivityLog";
import { config } from "../config";

const router: IRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive the public-facing frontend origin from the incoming request when
 *  FRONTEND_URL is not explicitly configured. */
function resolveFrontendUrl(req: import("express").Request): string {
  if (config.frontendUrl) return config.frontendUrl;
  // req.protocol is correct because trust proxy is enabled in app.ts
  return `${req.protocol}://${req.get("host")}`;
}

// ─── GET /api/auth/login ──────────────────────────────────────────────────────
router.get("/auth/login", (req, res): void => {
  // Use crypto.randomBytes for cryptographically-secure state tokens
  const state = randomBytes(24).toString("hex");

  req.session.oauthState = state;

  // ─── CRITICAL FIX ─────────────────────────────────────────────────────────
  // Explicitly call session.save() and wait for the callback BEFORE issuing
  // the redirect. Express-session writes to the store asynchronously; if we
  // redirect immediately the write may not complete before the response is
  // sent, so the Set-Cookie header is never flushed, the browser stores no
  // cookie, and the callback route gets a brand-new (empty) session where
  // oauthState is undefined → "Invalid state — possible CSRF".
  req.session.save((err) => {
    if (err) {
      logger.error({ err }, "Session save failed before OAuth redirect");
      res.status(500).json({ error: "Failed to initialise session — please try again" });
      return;
    }

    logger.info({ sessionId: req.sessionID }, "OAuth login: session saved, redirecting to Discord");

    const params = new URLSearchParams({
      client_id:     config.discordClientId,
      redirect_uri:  config.discordRedirectUri,
      response_type: "code",
      scope:         "identify guilds email",
      state,
      prompt:        "none",
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
  });
});

// ─── GET /api/auth/callback ───────────────────────────────────────────────────
router.get("/auth/callback", async (req, res): Promise<void> => {
  // Express query params can be string | string[] | ParsedQs — extract scalar values safely
  const raw = req.query as Record<string, string | string[] | undefined>;
  const code      = Array.isArray(raw.code)      ? raw.code[0]       : raw.code       as string | undefined;
  const state     = Array.isArray(raw.state)     ? raw.state[0]      : raw.state      as string | undefined;
  const oauthError = Array.isArray(raw.error)    ? raw.error[0]      : raw.error      as string | undefined;

  // Discord can redirect back with ?error= if the user declined
  if (oauthError) {
    logger.warn({ oauthError }, "OAuth declined by user or Discord error");
    const frontendUrl = resolveFrontendUrl(req);
    res.redirect(`${frontendUrl}/dashboard?error=access_denied`);
    return;
  }

  const savedState = req.session.oauthState;

  logger.info({
    sessionId:     req.sessionID,
    hasCode:       !!code,
    receivedState: state,
    savedState:    savedState ?? "(none)",
    hasCookie:     !!req.headers.cookie,
  }, "OAuth callback received");

  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  if (!savedState || state !== savedState) {
    logger.warn({
      sessionId:     req.sessionID,
      receivedState: state,
      savedState:    savedState ?? "(none — session may have been lost)",
      hasCookie:     !!req.headers.cookie,
    }, "OAuth state mismatch — possible CSRF or lost session");
    res.status(403).json({
      error:  "Invalid state — possible CSRF",
      detail: "Session was not preserved between login and callback. Ensure SESSION_SECRET is set and DISCORD_REDIRECT_URI is correct.",
    });
    return;
  }

  // Consume the state so it cannot be replayed
  delete req.session.oauthState;

  try {
    // ── Exchange code for tokens ─────────────────────────────────────────────
    logger.info({
      clientId:      config.discordClientId,
      clientIdLen:   config.discordClientId.length,
      secretLen:     config.discordClientSecret.length,
      secretPreview: config.discordClientSecret.slice(0, 4) + "…" + config.discordClientSecret.slice(-4),
      redirectUri:   config.discordRedirectUri,
      codeLen:       code.length,
      codePreview:   code.slice(0, 6) + "…",
    }, "Token exchange: sending request to Discord");

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     config.discordClientId,
        client_secret: config.discordClientSecret,
        grant_type:    "authorization_code",
        code,
        redirect_uri:  config.discordRedirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const rawBody = await tokenRes.text();
      let discordErr: unknown = rawBody;
      try { discordErr = JSON.parse(rawBody); } catch { /* keep raw */ }
      logger.error({
        status:       tokenRes.status,
        discordError: discordErr,
        clientIdLen:  config.discordClientId.length,
        secretLen:    config.discordClientSecret.length,
        redirectUri:  config.discordRedirectUri,
      }, "Discord token exchange failed");
      // Surface the exact Discord error so it's visible to the developer
      res.status(502).json({
        error:        "Discord token exchange failed",
        discordStatus: tokenRes.status,
        discordError:  discordErr,
        debug: {
          redirectUri:   config.discordRedirectUri,
          clientIdLen:   config.discordClientId.length,
          secretLen:     config.discordClientSecret.length,
          secretPreview: config.discordClientSecret.slice(0, 4) + "…",
        },
      });
      return;
    }

    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
    };

    // ── Fetch Discord user profile ───────────────────────────────────────────
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      logger.error({ status: userRes.status }, "Discord /users/@me failed");
      res.status(502).json({ error: "Failed to fetch Discord user profile" });
      return;
    }

    const discordUser = await userRes.json() as {
      id: string;
      username: string;
      global_name: string | null;
      avatar: string | null;
      email: string | null;
      discriminator: string;
    };

    // ── Upsert user in MongoDB ───────────────────────────────────────────────
    await UserData.findOneAndUpdate(
      { discordId: discordUser.id },
      {
        discordId:  discordUser.id,
        username:   discordUser.username,
        globalName: discordUser.global_name ?? discordUser.username,
        avatar:     discordUser.avatar,
        email:      discordUser.email,
        updatedAt:  new Date(),
      },
      { upsert: true, new: true },
    ).catch((err) => {
      // Non-fatal: log but don't block the login
      logger.warn({ err }, "MongoDB user upsert failed — continuing without DB");
    });

    // ── Populate session ─────────────────────────────────────────────────────
    req.session.discordId      = discordUser.id;
    req.session.accessToken    = tokens.access_token;
    req.session.refreshToken   = tokens.refresh_token;
    req.session.tokenExpiresAt = Date.now() + tokens.expires_in * 1000;

    // ── Persist session before redirecting ───────────────────────────────────
    req.session.save(async (saveErr) => {
      if (saveErr) {
        logger.error({ saveErr }, "Session save failed after OAuth success");
        res.status(500).json({ error: "Session persistence error" });
        return;
      }

      // Log activity (non-blocking)
      ActivityLog.create({
        userId: discordUser.id,
        action: "login",
        detail: "Discord OAuth2 login",
      }).catch((err) => logger.warn({ err }, "Activity log failed"));

      logger.info({ userId: discordUser.id, sessionId: req.sessionID }, "OAuth login success");

      const frontendUrl = resolveFrontendUrl(req);
      res.redirect(`${frontendUrl}/dashboard`);
    });
  } catch (err) {
    logger.error({ err }, "OAuth callback unexpected error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res): Promise<void> => {
  const discordId = req.session.discordId;

  if (!discordId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // ── Refresh token if near expiry (30-second buffer) ──────────────────────
  let accessToken = req.session.accessToken;

  if (Date.now() > (req.session.tokenExpiresAt ?? 0) - 30_000) {
    try {
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id:     config.discordClientId,
          client_secret: config.discordClientSecret,
          grant_type:    "refresh_token",
          refresh_token: req.session.refreshToken ?? "",
        }),
      });

      if (tokenRes.ok) {
        const t = await tokenRes.json() as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };
        req.session.accessToken    = t.access_token;
        req.session.refreshToken   = t.refresh_token;
        req.session.tokenExpiresAt = Date.now() + t.expires_in * 1000;
        accessToken = t.access_token;
        logger.info({ discordId }, "Access token refreshed");
      } else {
        logger.warn({ status: tokenRes.status, discordId }, "Token refresh failed");
      }
    } catch (err) {
      logger.warn({ err, discordId }, "Token refresh request failed");
    }
  }

  try {
    const [discordRes, userData] = await Promise.all([
      fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      UserData.findOne({ discordId }).catch(() => null),
    ]);

    if (!discordRes.ok) {
      if (discordRes.status === 401) {
        // Token is invalid and couldn't be refreshed — clear session
        req.session.destroy(() => {});
        res.status(401).json({ error: "Session expired — please log in again" });
        return;
      }
      res.status(502).json({ error: "Discord API unavailable" });
      return;
    }

    const profile = await discordRes.json();
    res.json({ profile, userData: userData ?? null });
  } catch (err) {
    logger.error({ err, discordId }, "auth/me error");
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── GET /api/auth/guilds ─────────────────────────────────────────────────────
router.get("/auth/guilds", async (req, res): Promise<void> => {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!guildsRes.ok) {
      res.status(502).json({ error: "Failed to fetch guilds" });
      return;
    }

    const guilds = await guildsRes.json() as Array<{
      id: string;
      name: string;
      icon: string | null;
      permissions: string;
      owner: boolean;
    }>;

    let botGuildIds = new Set<string>();

    try {
      const botGuildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds?limit=200", {
        headers: { Authorization: `Bot ${config.discordBotToken}` },
      });
      if (botGuildsRes.ok) {
        const botGuilds = await botGuildsRes.json() as Array<{ id: string }>;
        botGuildIds = new Set(botGuilds.map(g => g.id));
      }
    } catch (err) {
      logger.warn({ err }, "Bot guild fetch failed — botGuildIds will be empty");
    }

    const manageable = guilds.filter(g => (BigInt(g.permissions) & BigInt(0x20)) !== BigInt(0));
    res.json(manageable.map(g => ({ ...g, hasBot: botGuildIds.has(g.id) })));
  } catch (err) {
    logger.error({ err }, "guilds route error");
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post("/auth/logout", (req, res): void => {
  const discordId = req.session.discordId;

  req.session.destroy((err) => {
    if (err) {
      logger.warn({ err, discordId }, "Session destroy failed during logout");
    }
    res.clearCookie("lofiriya.sid");
    res.json({ ok: true });
  });
});

export default router;
                   
