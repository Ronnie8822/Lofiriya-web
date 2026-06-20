import { Router } from "express";
import mongoose from "mongoose";
import { config } from "../config";

const router = Router();

// ─── Service checkers ──────────────────────────────────────────────────────────

async function checkBot(): Promise<{
  connected: boolean;
  latency: number | null;
  detail: string;
}> {
  if (!config.discordBotToken) {
    return { connected: false, latency: null, detail: "Bot token not configured" };
  }
  const start = Date.now();
  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${config.discordBotToken}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (!res.ok) {
      return { connected: false, latency: null, detail: "Bot token invalid" };
    }
    const data = (await res.json()) as { username?: string };
    return {
      connected: true,
      latency,
      detail: data.username ? `@${data.username} · ${latency}ms` : `Connected · ${latency}ms`,
    };
  } catch {
    return { connected: false, latency: null, detail: "Not Connected" };
  }
}

async function checkLavalink(): Promise<{
  connected: boolean;
  latency: number | null;
  detail: string;
}> {
  const { lavalinkHost, lavalinkPort, lavalinkPassword, lavalinkSsl } = config;

  if (!lavalinkHost) {
    return { connected: false, latency: null, detail: "Not configured" };
  }

  const protocol = lavalinkSsl ? "https" : "http";
  const url = `${protocol}://${lavalinkHost}:${lavalinkPort}/version`;

  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Authorization: lavalinkPassword || "" },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (!res.ok) {
      return { connected: false, latency: null, detail: "Not Connected" };
    }
    const text = await res.text().catch(() => "");
    return {
      connected: true,
      latency,
      detail: text.trim() ? `v${text.trim()} · ${latency}ms` : `Node online · ${latency}ms`,
    };
  } catch {
    return { connected: false, latency: null, detail: "Not Connected" };
  }
}

// ─── GET /api/status ──────────────────────────────────────────────────────────

router.get("/status", async (_req, res): Promise<void> => {
  const apiStart = Date.now();

  // Run bot + lavalink checks concurrently
  const [botResult, lavalinkResult] = await Promise.allSettled([
    checkBot(),
    checkLavalink(),
  ]);

  const apiLatency = Date.now() - apiStart;

  const bot      = botResult.status === "fulfilled"      ? botResult.value      : { connected: false, latency: null, detail: "Not Connected" };
  const lavalink = lavalinkResult.status === "fulfilled" ? lavalinkResult.value : { connected: false, latency: null, detail: "Not Connected" };

  // MongoDB
  const mongoState    = mongoose.connection.readyState; // 0=disconnected 1=connected 2=connecting 3=disconnecting
  const mongoConnected = mongoState === 1;
  const mongoDetail   = mongoConnected
    ? "Connected"
    : config.mongodbUri
    ? "Connection failed"
    : "Not configured";

  // Process uptime
  const uptimeSec = Math.floor(process.uptime());
  const uptimeStr =
    uptimeSec < 60   ? `${uptimeSec}s`
    : uptimeSec < 3600 ? `${Math.floor(uptimeSec / 60)}m uptime`
    : `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m uptime`;

  const services = [
    {
      name:      "Bot",
      status:    bot.connected ? "operational" : "outage",
      latency:   bot.latency,
      detail:    bot.connected ? bot.detail : "Not Connected",
      connected: bot.connected,
    },
    {
      name:      "Lavalink Nodes",
      status:    lavalink.connected ? "operational" : "outage",
      latency:   lavalink.latency,
      detail:    lavalink.connected ? lavalink.detail : "Not Connected",
      connected: lavalink.connected,
    },
    {
      name:      "Database",
      status:    mongoConnected ? "operational" : (config.mongodbUri ? "outage" : "outage"),
      latency:   null,
      detail:    mongoDetail,
      connected: mongoConnected,
    },
    {
      name:      "API",
      status:    "operational",
      latency:   apiLatency,
      detail:    `Express · ${apiLatency}ms`,
      connected: true,
    },
    {
      name:      "Website",
      status:    "operational",
      latency:   null,
      detail:    uptimeStr,
      connected: true,
    },
  ] as const;

  // Overall: operational only if bot+lavalink+db are up, degraded if partial, outage if critical
  const criticalUp = services.filter(s =>
    ["Bot", "Lavalink Nodes", "Database"].includes(s.name) && s.connected
  ).length;
  const overall =
    criticalUp === 3 ? "operational"
    : criticalUp >= 1 ? "degraded"
    : "outage";

  res.json({
    overall,
    services,
    meta: {
      uptime:     uptimeSec,
      timestamp:  new Date().toISOString(),
      checkedAt:  new Date().toISOString(),
    },
  });
});

export default router;
      
