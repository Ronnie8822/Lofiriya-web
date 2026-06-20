import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { connectMongo } from "./lib/mongo";
import { config } from "./config";

connectMongo().catch((err) => logger.error({ err }, "MongoDB init failed"));

const app: Express = express();

// ─── CRITICAL: Trust Replit's reverse proxy ───────────────────────────────────
// Without this, Express doesn't trust X-Forwarded-Proto, so:
//   - req.protocol is always "http" even on HTTPS connections
//   - secure session cookies are never sent back to the client
// Must be set before any middleware.
app.set("trust proxy", 1);

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── Session ──────────────────────────────────────────────────────────────────
const sessionStore = config.mongodbUri
  ? MongoStore.create({
      mongoUrl: config.mongodbUri,
      ttl: 7 * 24 * 60 * 60,
      autoRemove: "interval",
      autoRemoveInterval: 60,
      collectionName: "sessions",
    })
  : undefined;

app.use(
  session({
    name: "lofiriya.sid",
    secret: config.sessionSecret,
    resave: false,
    // saveUninitialized: true is required for the OAuth flow — the login route
    // creates a new (uninitialised) session and stores oauthState in it. If false,
    // the session is never persisted and the cookie is never sent.
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      // "auto" sets secure=true when req.secure is true (requires trust proxy).
      secure: "auto",
      httpOnly: true,
      // "lax" allows the cookie on top-level cross-site navigations (the OAuth
      // redirect chain). "strict" would block it on the Discord callback.
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = new Set<string>(
  [config.frontendUrl, config.apiUrl].filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (origin.endsWith(".replit.dev") || origin.endsWith(".replit.app")) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Static frontend (production combined-server mode) ────────────────────────
// In development, the Vite dev server handles the frontend on its own port and
// proxies /api to us. In production (or when the dist folder exists), we serve
// the built React app and provide a SPA fallback so client-side routing works.
// process.cwd() when pnpm runs us is artifacts/api-server/ — the static
// build output is one level up at artifacts/lofiriya/dist/public/.
const STATIC_DIR =
  process.env["STATIC_DIR"] ??
  path.join(process.cwd(), "../lofiriya/dist/public");

if (fs.existsSync(STATIC_DIR)) {
  logger.info({ staticDir: STATIC_DIR }, "Serving static frontend files");

  // Serve assets (JS, CSS, images) with long cache headers
  app.use(
    express.static(STATIC_DIR, {
      maxAge: config.isProduction ? "1y" : 0,
      index: false, // don't auto-serve index.html here — we handle it below
    }),
  );

  // SPA fallback: serve index.html for any route not matched above so that
  // React Router (wouter) can handle client-side navigation.
  // Express 5 + path-to-regexp v8 no longer accept bare "*" — use "/{*path}".
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });
} else {
  logger.info("No static dir found — running in API-only / dev mode");
}

export default app;
