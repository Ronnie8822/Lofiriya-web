import { mongoose } from "../lib/mongo";

const { Schema, model, models } = mongoose;

const SongSchema = new Schema({
  title:     { type: String, required: true },
  artist:    { type: String, default: "" },
  duration:  { type: Number, default: 0 },
  source:    { type: String, default: "youtube" },
  thumbnail: { type: String, default: null },
  url:       { type: String, required: true },
  addedAt:   { type: Date, default: Date.now },
  addedBy:   { type: String, default: "" },
}, { _id: true });

const PlaylistSchema = new Schema({
  ownerId:     { type: String, required: true, index: true },
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  songs:       { type: [SongSchema], default: [] },
  color:       { type: String, default: "from-violet-500 to-indigo-600" },
  isPublic:    { type: Boolean, default: false },
}, { timestamps: true });

export const Playlist = models["Playlist"] || model("Playlist", PlaylistSchema);
