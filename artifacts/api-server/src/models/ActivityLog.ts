import { mongoose } from "../lib/mongo";

const { Schema, model, models } = mongoose;

const ActivityLogSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  action:    { type: String, required: true },
  detail:    { type: String, default: "" },
  meta:      { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const ActivityLog = models["ActivityLog"] || model("ActivityLog", ActivityLogSchema);
