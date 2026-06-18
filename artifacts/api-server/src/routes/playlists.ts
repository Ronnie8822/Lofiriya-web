import { Router, type IRouter } from "express";
import { Playlist } from "../models/Playlist";
import { UserData } from "../models/UserData";
import { ActivityLog } from "../models/ActivityLog";

const router: IRouter = Router();

const FREE_LIMIT    = 10;
const PREMIUM_LIMIT = 60;

async function requireSession(
  req: import("express").Request,
  res: import("express").Response,
): Promise<string | null> {
  const id = req.session.discordId;
  if (!id) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return id;
}

// GET /api/playlists
router.get("/playlists", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const playlists = await Playlist.find({ ownerId: userId }).sort({ createdAt: -1 });
  res.json(playlists);
});

// POST /api/playlists
router.post("/playlists", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;

  const { name, description, color } = req.body as {
    name?: string; description?: string; color?: string;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "Playlist name is required" });
    return;
  }

  const userData  = await UserData.findOne({ discordId: userId });
  const isPremium = (userData?.premium as { active?: boolean } | null)?.active ?? false;
  const limit     = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const count     = await Playlist.countDocuments({ ownerId: userId });
  if (count >= limit) {
    res.status(403).json({
      error: `Playlist limit reached (${limit}).${!isPremium ? " Upgrade to Premium for up to 60 playlists." : ""}`,
    });
    return;
  }

  const playlist = await Playlist.create({
    ownerId:     userId,
    name:        name.trim(),
    description: description?.trim() ?? "",
    color:       color ?? "from-violet-500 to-indigo-600",
    songs:       [],
  });

  await Promise.all([
    UserData.findOneAndUpdate({ discordId: userId }, { $inc: { savedPlaylists: 1 } }),
    ActivityLog.create({ userId, action: "playlist_created", detail: name.trim() }),
  ]);

  res.status(201).json(playlist);
});

// PATCH /api/playlists/:id
router.patch("/playlists/:id", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const playlist = await Playlist.findOne({ _id: id, ownerId: userId });
  if (!playlist) { res.status(404).json({ error: "Playlist not found" }); return; }

  const { name, description, color } = req.body as {
    name?: string; description?: string; color?: string;
  };
  if (name        !== undefined) (playlist as { name: string }).name               = name.trim();
  if (description !== undefined) (playlist as { description: string }).description = description.trim();
  if (color       !== undefined) (playlist as { color: string }).color             = color;

  await playlist.save();
  await ActivityLog.create({ userId, action: "playlist_updated", detail: (playlist as { name: string }).name });
  res.json(playlist);
});

// DELETE /api/playlists/:id
router.delete("/playlists/:id", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const playlist = await Playlist.findOneAndDelete({ _id: id, ownerId: userId });
  if (!playlist) { res.status(404).json({ error: "Playlist not found" }); return; }

  await Promise.all([
    UserData.findOneAndUpdate({ discordId: userId }, { $inc: { savedPlaylists: -1 } }),
    ActivityLog.create({ userId, action: "playlist_deleted", detail: (playlist as { name: string }).name }),
  ]);

  res.sendStatus(204);
});

// POST /api/playlists/:id/songs
router.post("/playlists/:id/songs", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const { title, artist, duration, source, thumbnail, url } = req.body as {
    title?: string; artist?: string; duration?: number;
    source?: string; thumbnail?: string; url?: string;
  };
  if (!title?.trim() || !url?.trim()) {
    res.status(400).json({ error: "title and url are required" });
    return;
  }

  const playlist = await Playlist.findOne({ _id: id, ownerId: userId });
  if (!playlist) { res.status(404).json({ error: "Playlist not found" }); return; }

  (playlist as { songs: unknown[] }).songs.push({
    title: title.trim(), artist: artist?.trim() ?? "",
    duration: duration ?? 0, source: source ?? "youtube",
    thumbnail: thumbnail ?? null, url: url.trim(),
    addedAt: new Date(), addedBy: userId,
  });

  await playlist.save();
  await UserData.findOneAndUpdate({ discordId: userId }, { $inc: { favoriteSongs: 1 } });
  res.json(playlist);
});

// DELETE /api/playlists/:id/songs/:songId
router.delete("/playlists/:id/songs/:songId", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const id     = Array.isArray(req.params.id)     ? req.params.id[0]     : req.params.id;
  const songId = Array.isArray(req.params.songId) ? req.params.songId[0] : req.params.songId;

  const playlist = await Playlist.findOne({ _id: id, ownerId: userId });
  if (!playlist) { res.status(404).json({ error: "Playlist not found" }); return; }

  const songs  = (playlist as { songs: Array<{ _id: { toString(): string } }> }).songs;
  const before = songs.length;
  (playlist as { songs: unknown[] }).songs = songs.filter(s => s._id.toString() !== songId);
  if ((playlist as { songs: unknown[] }).songs.length === before) {
    res.status(404).json({ error: "Song not found" });
    return;
  }

  await playlist.save();
  res.json(playlist);
});

// POST /api/playlists/:id/duplicate
router.post("/playlists/:id/duplicate", async (req, res): Promise<void> => {
  const userId = await requireSession(req, res);
  if (!userId) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const userData  = await UserData.findOne({ discordId: userId });
  const isPremium = (userData?.premium as { active?: boolean } | null)?.active ?? false;
  const limit     = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const count     = await Playlist.countDocuments({ ownerId: userId });
  if (count >= limit) {
    res.status(403).json({ error: `Playlist limit reached (${limit})` });
    return;
  }

  const original = await Playlist.findOne({ _id: id, ownerId: userId });
  if (!original) { res.status(404).json({ error: "Playlist not found" }); return; }

  const o = original as { name: string; description: string; color: string; songs: unknown[] };
  const copy = await Playlist.create({
    ownerId: userId, name: `${o.name} (copy)`,
    description: o.description, color: o.color, songs: o.songs,
  });

  await UserData.findOneAndUpdate({ discordId: userId }, { $inc: { savedPlaylists: 1 } });
  res.status(201).json(copy);
});

export default router;
