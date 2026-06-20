/**
 * LOFIRIYA — Centralised Environment Configuration
 *
 * All environment variables are loaded and validated here at startup.
 * The rest of the application imports `config` from this file rather than
 * reading `process.env` directly, keeping secrets out of business logic
 * and making misconfiguration obvious immediately on boot.
 */

// ─── Variable registry ────────────────────────────────────────────────────────

interface EnvSpec {
  key: string;
  description: string;
  whereToGet: string;
  required: boolean;
}

const ENV_REGISTRY: EnvSpec[] = [
  // ── Discord Bot ──────────────────────────────────────────────────────────────
  {
    key: "DISCORD_BOT_TOKEN",
    description: "Token for your Discord bot — used for bot-level API calls such as fetching which guilds the bot has joined.",
    whereToGet: "Discord Developer Portal (https://discord.com/developers/applications) → Your Application → Bot → Reset Token",
    required: true,
  },

  // ── Discord OAuth2 ───────────────────────────────────────────────────────────
  {
    key: "DISCORD_CLIENT_ID",
    description: "Discord application client ID — included in the OAuth2 authorization URL so Discord knows which app is requesting access.",
    whereToGet: "Discord Developer Portal → Your Application → OAuth2 → Client ID (copy button)",
    required: true,
  },
  {
    key: "DISCORD_CLIENT_SECRET",
    description: "Discord application client secret — used server-side to exchange authorization codes for access tokens. Never expose this client-side.",
    whereToGet: "Discord Developer Portal → Your Application → OAuth2 → Client Secret → Reset Secret",
    required: true,
  },
  {
    key: "DISCORD_REDIRECT_URI",
    description: "Full callback URL where Discord redirects the user after they authorize (or deny) your app. Must EXACTLY match one of the Redirect URIs registered in the Developer Portal.",
    whereToGet: "Set to <your-api-domain>/api/auth/callback, then register that same URL at: Discord Developer Portal → Your Application → OAuth2 → Redirects → Add Redirect",
    required: true,
  },

  // ── Session / Auth ───────────────────────────────────────────────────────────
  {
    key: "SESSION_SECRET",
    description: "Long random string used to sign session cookies — prevents tampering. Must stay secret. Rotating this invalidates all existing sessions.",
    whereToGet: 'Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
    required: true,
  },

  // ── MongoDB ──────────────────────────────────────────────────────────────────
  {
    key: "MONGODB_URI",
    description: "MongoDB connection string for persisting user data, guild settings, playlists, and sessions. Without this, the app runs with in-memory sessions (data lost on restart).",
    whereToGet: "MongoDB Atlas (https://cloud.mongodb.com) → Create Free Cluster → Connect → Drivers → Node.js → Copy connection string",
    required: false,
  },

  // ── Dashboard URLs ───────────────────────────────────────────────────────────
  {
    key: "FRONTEND_URL",
    description: "Public URL of the dashboard frontend. Used for post-login redirects (after OAuth2 callback) and CORS origin allowlist.",
    whereToGet: "Your deployed frontend URL, e.g. https://your-app.replit.app  (leave empty to auto-detect from the incoming request origin)",
    required: false,
  },
  {
    key: "API_URL",
    description: "Public URL of this API server. Used for health-check links and self-referencing documentation.",
    whereToGet: "Your deployed API URL, e.g. https://your-api.replit.dev",
    required: false,
  },

  // ── Support Webhook ──────────────────────────────────────────────────────────
  {
    key: "SUPPORT_WEBHOOK_URL",
    description: "Discord webhook URL that receives bug reports and feature requests submitted via the support page.",
    whereToGet: "Discord Server → desired channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy Webhook URL",
    required: false,
  },

  // ── Infrastructure ───────────────────────────────────────────────────────────
  {
    key: "NODE_ENV",
    description: "Runtime environment. Controls logging verbosity, cookie security, and other environment-specific behaviour.",
    whereToGet: 'Set to "development" locally, "production" in deployed environments.',
    required: false,
  },
  {
    key: "PORT",
    description: "Port the API server listens on.",
    whereToGet: "Default: 3001. The Replit workflow sets this automatically.",
    required: false,
  },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEnv(): void {
  const missing = ENV_REGISTRY.filter(
    (spec) => spec.required && !process.env[spec.key],
  );

  if (missing.length === 0) return;

  const banner = [
    "",
    "╔══════════════════════════════════════════════════════════════════════╗",
    "║       LOFIRIYA — Missing Required Environment Variables              ║",
    "╚══════════════════════════════════════════════════════════════════════╝",
    "",
    `${missing.length} required variable${missing.length === 1 ? " is" : "s are"} not set:`,
    "",
    ...missing.flatMap((spec) => [
      `  ✗ ${spec.key}`,
      `    What it does : ${spec.description}`,
      `    Where to get : ${spec.whereToGet}`,
      "",
    ]),
    "─────────────────────────────────────────────────────────────────────",
    "  Add these to your environment:",
    "    • Replit: Secrets tab in the left sidebar (lock icon)",
    "    • Local : copy .env.example → .env and fill in the values",
    "─────────────────────────────────────────────────────────────────────",
    "",
  ];

  console.error(banner.join("\n"));
  process.exit(1);
}

validateEnv();

// ─── Typed config export ──────────────────────────────────────────────────────

const rawPort = process.env["PORT"];
const parsedPort = rawPort ? Number(rawPort) : 3001;

export const config = {
  // Discord Bot
  discordBotToken: process.env["DISCORD_BOT_TOKEN"]!,

  // Discord OAuth2
  discordClientId:     process.env["DISCORD_CLIENT_ID"]!,
  discordClientSecret: process.env["DISCORD_CLIENT_SECRET"]!,
  discordRedirectUri:  process.env["DISCORD_REDIRECT_URI"]!,

  // Session / Auth
  sessionSecret: process.env["SESSION_SECRET"]!,

  // MongoDB (optional — app runs without it using in-memory sessions).
  // Ignore placeholder values from .env templates (e.g. PASTE_YOUR_MONGODB_URI).
  mongodbUri: (() => {
    const uri = process.env["MONGODB_URI"];
    if (!uri) return null;
    if (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) return uri;
    return null; // placeholder or invalid value — treat as unset
  })(),

  // Dashboard URLs
  frontendUrl: process.env["FRONTEND_URL"] ?? "",
  apiUrl:      process.env["API_URL"] ?? "",

  // Support webhook (optional — support form is disabled when absent)
  supportWebhookUrl:
    process.env["SUPPORT_WEBHOOK_URL"] ??
    // backward-compat alias used in older deployments
    process.env["DISCORD_WEBHOOK_URL"] ??
    null,

  // Lavalink audio node
  lavalinkHost:     process.env["LAVALINK_HOST"]     ?? "",
  lavalinkPort:     Number(process.env["LAVALINK_PORT"] ?? "3040"),
  lavalinkPassword: process.env["LAVALINK_PASSWORD"] ?? "",
  lavalinkSsl:      (process.env["LAVALINK_SSL"] ?? "false").toLowerCase() === "true",

  // Infrastructure
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  port:    Number.isNaN(parsedPort) || parsedPort <= 0 ? 3001 : parsedPort,

  // Derived helpers
  get isProduction() {
    return this.nodeEnv === "production";
  },
} as const;

export type Config = typeof config;
