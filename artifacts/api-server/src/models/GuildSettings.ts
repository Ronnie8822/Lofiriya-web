import { mongoose } from "../lib/mongo";

const { Schema, model, models } = mongoose;

const GuildSettingsSchema = new Schema({
  guildId:    { type: String, required: true, unique: true, index: true },
  prefix:     { type: String, default: "/" },
  volume:     { type: Number, default: 100 },
  mode247:    { type: Boolean, default: false },
  autoplay:   { type: Boolean, default: false },
  djRoleId:   { type: String, default: null },
}, { timestamps: true });

export const GuildSettings = models["GuildSettings"] || model("GuildSettings", GuildSettingsSchema);
