import mongoose from "mongoose";
import { logger } from "./logger";
import { config } from "../config";

let connected = false;

export async function connectMongo(): Promise<void> {
  if (connected) return;

  if (!config.mongodbUri) {
    logger.warn("MONGODB_URI not set — MongoDB features disabled (sessions will use in-memory store)");
    return;
  }

  try {
    await mongoose.connect(config.mongodbUri);
    connected = true;
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
  }
}

/** Returns the current Mongoose connection state as a human-readable string. */
export function mongoStatus(): { connected: boolean; state: string } {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const stateNum = mongoose.connection.readyState;
  return {
    connected: stateNum === 1,
    state: states[stateNum] ?? "unknown",
  };
}

export { mongoose };
