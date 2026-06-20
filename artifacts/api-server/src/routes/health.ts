import { Router, type IRouter } from "express";
import { mongoStatus } from "../lib/mongo";
import { config } from "../config";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const mongo = mongoStatus();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    mongo: {
      configured: !!config.mongodbUri,
      ...mongo,
    },
    discord: {
      clientIdConfigured:     !!config.discordClientId,
      clientIdLen:            config.discordClientId.length,
      clientIdPreview:        config.discordClientId.slice(0, 6) + "…",
      secretConfigured:       !!config.discordClientSecret,
      secretLen:              config.discordClientSecret.length,
      secretPreview:          config.discordClientSecret.slice(0, 4) + "…",
      redirectUriConfigured:  !!config.discordRedirectUri,
      redirectUri:            config.discordRedirectUri,
    },
    urls: {
      frontendUrl: config.frontendUrl || "(auto-detected from request)",
      apiUrl:      config.apiUrl      || "(not set)",
    },
  });
});

export default router;
