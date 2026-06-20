// Load .env file FIRST — before any other imports.
// In Replit, secrets from the Secrets tab take precedence over .env values
// automatically. This import is a no-op when variables are already set.
import "dotenv/config";

// Config validates all required environment variables and calls process.exit(1)
// with a clear error message if any are missing — must come before app/routes.
import "./config";

import { createServer } from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { config } from "./config";

const server = createServer(app);

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});

server.listen(config.port, "0.0.0.0", () => {
  logger.info({ port: config.port }, "API server listening");
});
