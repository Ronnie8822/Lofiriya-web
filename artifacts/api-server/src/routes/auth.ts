import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { UserData } from "../models/UserData";
import { ActivityLog } from "../models/ActivityLog";

const router: IRouter = Router();

const CLIENT_ID     = process.env["DISCORD_CLIENT_ID"]     ?? "";
const CLIENT_SECRET = process.env["DISCORD_CLIENT_SECRET"] ?? "";
const REDIRECT_URI  = process.env["DISCORD_REDIRECT_URI"]  ?? "";

// GET /api/auth/login
router.get("/auth/login", (req, res): void => {
  const state = Math.random().toString(36).slice(2);
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "identify guilds email",
    state,
    prompt:        "none",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// GET /api/auth/callback
router.get("/auth/callback", async (req, res): Promise<void> => {
  const { code, state } = req.query as Record<string, string>;
  const savedState = req.session.oauthState;

  if (!code) {
    res.status(400).json({ error: "Missing code" });
    return;
  }
  if (state !== savedState) {
    res.status(403).json({ error: "Invalid state — possible CSRF" });
    return;
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    "authorization_code",
        code,
        redirect_uri:  REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      req.log.error({ err }, "Discord token exchange failed");
      res.status(502).json({ error: "Discord token exchange failed" });
      return;
    }
    const tokens = await tokenRes.json() as {
      access_token: string; refresh_token: string; expires_in: number; token_type: string;
    };

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) {
      res.status(502).json({ error: "Failed to fetch Discord user" });
      return;
    }
    const discordUser = await userRes.json() as {
      id: string; username: string; global_name: string | null;
      avatar: string | null; email: string | null; discriminator: string;
    };

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
    );

    req.session.discordId      = discordUser.id;
    req.session.accessToken    = tokens.access_token;
    req.session.refreshToken   = tokens.refresh_token;
    req.session.tokenExpiresAt = Date.now() + tokens.expires_in * 1000;

    await ActivityLog.create({
      userId: discordUser.id,
      action: "login",
      detail: "Discord OAuth2 login",
    });

    req.log.info({ userId: discordUser.id }, "OAuth login success");

    const origin = req.headers["origin"] as string | undefined;
    const host   = origin ?? `https://${req.headers["host"] ?? ""}`;
    res.redirect(`${host}/dashboard`);
  } catch (err) {
    req.log.error({ err }, "OAuth callback error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const discordId = req.session.discordId;
  if (!discordId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let accessToken = req.session.accessToken;

  if (Date.now() > (req.session.tokenExpiresAt ?? 0) - 30_000) {
    try {
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type:    "refresh_token",
          refresh_token: req.session.refreshToken ?? "",
        }),
      });
      if (tokenRes.ok) {
        const t = await tokenRes.json() as {
          access_token: string; refresh_token: string; expires_in: number;
        };
        req.session.accessToken    = t.access_token;
        req.session.refreshToken   = t.refresh_token;
        req.session.tokenExpiresAt = Date.now() + t.expires_in * 1000;
        accessToken = t.access_token;
      }
    } catch (err) {
      req.log.warn({ err }, "Token refresh failed");
    }
  }

  try {
    const [discordRes, userData] = await Promise.all([
      fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      UserData.findOne({ discordId }),
    ]);

    if (!discordRes.ok) {
      res.status(502).json({ error: "Discord API unavailable" });
      return;
    }
    const profile = await discordRes.json();
    res.json({ profile, userData: userData ?? null });
  } catch (err) {
    req.log.error({ err }, "auth/me error");
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/auth/guilds
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
      id: string; name: string; icon: string | null; permissions: string; owner: boolean;
    }>;

    const BOT_TOKEN = process.env["DISCORD_BOT_TOKEN"] ?? "";
    let botGuildIds = new Set<string>();
    try {
      const botGuildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds?limit=200", {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      });
      if (botGuildsRes.ok) {
        const botGuilds = await botGuildsRes.json() as Array<{ id: string }>;
        botGuildIds = new Set(botGuilds.map(g => g.id));
      }
    } catch (err) {
      req.log.warn({ err }, "Bot guild fetch failed");
    }

    const manageable = guilds.filter(g => (BigInt(g.permissions) & BigInt(0x20)) !== BigInt(0));
    const result = manageable.map(g => ({ ...g, hasBot: botGuildIds.has(g.id) }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "guilds error");
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("lofiriya.sid");
    res.json({ ok: true });
  });
});

export default router;
