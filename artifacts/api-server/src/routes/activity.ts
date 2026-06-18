import { Router, type IRouter } from "express";
import { ActivityLog } from "../models/ActivityLog";

const router: IRouter = Router();

// GET /api/activity?page=1&limit=20&search=&action=
router.get("/activity", async (req, res): Promise<void> => {
  const discordId = req.session.discordId;
  if (!discordId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const page   = Math.max(1, parseInt((req.query["page"]   as string) ?? "1",  10));
  const limit  = Math.min(50, Math.max(1, parseInt((req.query["limit"] as string) ?? "20", 10)));
  const search = ((req.query["search"] as string) ?? "").trim();
  const action = ((req.query["action"] as string) ?? "").trim();

  const query: Record<string, unknown> = { userId: discordId };
  if (search) query["detail"] = { $regex: search, $options: "i" };
  if (action) query["action"] = action;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ActivityLog.countDocuments(query),
  ]);

  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
});

export default router;
