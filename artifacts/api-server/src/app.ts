import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import MongoStore from "connect-mongo";
import router from "./routes";
import { logger } from "./lib/logger";
import { connectMongo } from "./lib/mongo";

connectMongo().catch((err) => logger.error({ err }, "MongoDB init failed"));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const mongoUri = process.env["MONGODB_URI"];

app.use(
  session({
    name:   "lofiriya.sid",
    secret: process.env["SESSION_SECRET"] ?? "fallback-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: mongoUri
      ? MongoStore.create({
          mongoUrl: mongoUri,
          ttl: 7 * 24 * 60 * 60, // 7 days
          autoRemove: "interval",
          autoRemoveInterval: 60,
        })
      : undefined,
    cookie: {
      secure:   process.env["NODE_ENV"] === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
