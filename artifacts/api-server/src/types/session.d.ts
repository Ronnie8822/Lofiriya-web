import "express-session";

declare module "express-session" {
  interface SessionData {
    oauthState:     string;
    discordId:      string;
    accessToken:    string;
    refreshToken:   string;
    tokenExpiresAt: number;
  }
}
