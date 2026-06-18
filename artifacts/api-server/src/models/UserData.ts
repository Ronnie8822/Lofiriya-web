import { mongoose } from "../lib/mongo";

const { Schema, model, models } = mongoose;

const PremiumSchema = new Schema({
  active:    { type: Boolean, default: false },
  plan:      { type: String, default: "free" },
  since:     { type: Date, default: null },
  expiresAt: { type: Date, default: null },
}, { _id: false });

const UserDataSchema = new Schema({
  discordId:        { type: String, required: true, unique: true, index: true },
  username:         { type: String, default: "" },
  globalName:       { type: String, default: "" },
  avatar:           { type: String, default: null },
  email:            { type: String, default: null },
  premium:          { type: PremiumSchema, default: () => ({}) },
  savedPlaylists:   { type: Number, default: 0 },
  favoriteSongs:    { type: Number, default: 0 },
  totalSongsPlayed: { type: Number, default: 0 },
  totalListenTime:  { type: Number, default: 0 }, // seconds
  premiumServers:   { type: Number, default: 0 },
  createdAt:        { type: Date, default: Date.now },
  updatedAt:        { type: Date, default: Date.now },
}, { timestamps: true });

export const UserData = models["UserData"] || model("UserData", UserDataSchema);
