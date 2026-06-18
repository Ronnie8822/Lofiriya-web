import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// Simple in-memory rate limiter — max 3 submissions per IP per 10 minutes
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

async function sendWebhook(payload: object): Promise<void> {
  const url = process.env["DISCORD_WEBHOOK_URL"];
  if (!url) throw new Error("DISCORD_WEBHOOK_URL not configured");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Webhook failed: ${res.status} ${text}`);
  }
}

// POST /api/support/bug
router.post("/support/bug", async (req: Request, res: Response) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many submissions. Please wait a few minutes." });
    return;
  }

  const { username, userid, title, category, description, steps, screenshot, serverid } = req.body as Record<string, string>;

  if (!username?.trim() || !userid?.trim() || !title?.trim() || !category?.trim() || !description?.trim() || !steps?.trim()) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    await sendWebhook({
      embeds: [
        {
          title: "🐞 New Bug Report",
          color: 0x9B59B6,
          fields: [
            { name: "Discord Username", value: username.slice(0, 256), inline: true },
            { name: "Discord User ID",  value: userid.slice(0, 256),   inline: true },
            { name: "Issue Title",      value: title.slice(0, 256) },
            { name: "Category",         value: category.slice(0, 100),  inline: true },
            { name: "Description",      value: description.slice(0, 1024) },
            { name: "Steps To Reproduce", value: steps.slice(0, 1024) },
            { name: "Screenshot",       value: screenshot?.trim() || "None",        inline: true },
            { name: "Server ID",        value: serverid?.trim() || "Not Provided",  inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "LOFIRIYA Bug Report System" },
        },
      ],
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Bug report webhook failed");
    res.status(500).json({ error: "Failed to send report. Please try again." });
  }
});

// POST /api/support/feature
router.post("/support/feature", async (req: Request, res: Response) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many submissions. Please wait a few minutes." });
    return;
  }

  const { username, title, description, reason } = req.body as Record<string, string>;

  if (!username?.trim() || !title?.trim() || !description?.trim() || !reason?.trim()) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    await sendWebhook({
      embeds: [
        {
          title: "🚀 New Feature Request",
          color: 0x5865F2,
          fields: [
            { name: "Discord Username",      value: username.slice(0, 256) },
            { name: "Suggestion Title",      value: title.slice(0, 256) },
            { name: "Description",           value: description.slice(0, 1024) },
            { name: "Why Should This Be Added?", value: reason.slice(0, 1024) },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "LOFIRIYA Feature Request System" },
        },
      ],
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Feature request webhook failed");
    res.status(500).json({ error: "Failed to send request. Please try again." });
  }
});

export default router;
