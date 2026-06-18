import { Router, type IRouter } from "express";
import { GuildSettings } from "../models/GuildSettings";
import { ActivityLog } from "../models/ActivityLog";

const router: IRouter = Router();

async function requireSession(
  req: import("express").Request,
  res: import("express").Response,
): Promise<string | null> {
  const id = req.session.discordId;
  if (!id) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return id;
}

async function verifyManageGuild(
  req: import("express").Request,
  res: import("express").Response,
  guildId: string,
): Promise<boolean> {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  try {
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!guildsRes.ok) return false;
    const guilds = await guildsRes.json() as Array<{ id: string; permissions: string }>;
    const guild  = guilds.find(g => g.id === guildId);
    if (!guild) {
      res.status(403).json({ error: "You are not in this server" });
      return false;
    }
    const hasManage = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
    if (!hasManage) {
      res.status(403).json({ error: "You don't have permission to manage this server" });
      return false;
    }
    return true;
  } catch {
    res.status(500).json({ error: "Permission check failed" });
    return false;
  }
}

// GET /api/guild/:guildId/settings
router.get("/guild/:guildId/settings", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const guildId = Array.isArray(req.params.guildId) ? req.params.guildId[0] : req.params.guildId;
  const ok = await verifyManageGuild(req, res, guildId);
  if (!ok) return;

  const settings = await GuildSettings.findOne({ guildId }) ?? {
    guildId, prefix: "/", volume: 100, mode247: false, autoplay: false, djRoleId: null,
  };
  res.json(settings);
});

// PATCH /api/guild/:guildId/settings
router.patch("/guild/:guildId/settings", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const guildId = Array.isArray(req.params.guildId) ? req.params.guildId[0] : req.params.guildId;
  const ok = await verifyManageGuild(req, res, guildId);
  if (!ok) return;

  const { prefix, volume, mode247, autoplay, djRoleId } = req.body as {
    prefix?: string; volume?: number; mode247?: boolean; autoplay?: boolean; djRoleId?: string | null;
  };

  const update: Record<string, unknown> = {};
  if (prefix !== undefined) {
    if (typeof prefix !== "string" || prefix.length > 5 || prefix.includes(" ")) {
      res.status(400).json({ error: "Prefix must be ≤5 chars and no spaces" });
      return;
    }
    update["prefix"] = prefix;
  }
  if (volume !== undefined) {
    const v = Number(volume);
    if (isNaN(v) || v < 0 || v > 200) {
      res.status(400).json({ error: "Volume must be 0–200" });
      return;
    }
    update["volume"] = v;
  }
  if (mode247 !== undefined) update["mode247"]  = Boolean(mode247);
  if (autoplay !== undefined) update["autoplay"] = Boolean(autoplay);
  if (djRoleId !== undefined) update["djRoleId"] = djRoleId ?? null;

  const settings = await GuildSettings.findOneAndUpdate(
    { guildId },
    { $set: update },
    { upsert: true, new: true },
  );

  await ActivityLog.create({ userId, action: "settings_updated", detail: `Guild ${guildId}`, meta: update });
  res.json(settings);
});

// GET /api/guild/:guildId/roles
router.get("/guild/:guildId/roles", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const guildId = Array.isArray(req.params.guildId) ? req.params.guildId[0] : req.params.guildId;

  const BOT_TOKEN = process.env["DISCORD_BOT_TOKEN"] ?? "";
  try {
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!rolesRes.ok) {
      res.status(502).json({ error: "Could not fetch roles — bot may not be in this server" });
      return;
    }
    const roles = await rolesRes.json() as Array<{ id: string; name: string; color: number; position: number }>;
    const sorted = roles
      .filter(r => r.name !== "@everyone")
      .sort((a, b) => b.position - a.position);
    res.json(sorted);
  } catch (err) {
    req.log.error({ err }, "roles fetch error");
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/guild/:guildId/player
router.get("/guild/:guildId/player", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const guildId = Array.isArray(req.params.guildId) ? req.params.guildId[0] : req.params.guildId;

  const BOT_TOKEN = process.env["DISCORD_BOT_TOKEN"] ?? "";
  try {
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!guildRes.ok) {
      res.json({ active: false, reason: "Bot not in this server" });
      return;
    }
    res.json({ active: false, reason: "No active player session" });
  } catch {
    res.json({ active: false, reason: "Could not reach bot" });
  }
});

export default router;
