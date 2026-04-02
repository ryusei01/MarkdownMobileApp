export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  sessionIssuer: process.env.SESSION_ISSUER ?? "markdown-editor-app",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  revenueCatWebhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? "",
  devGrantAllPro: process.env.DEV_GRANT_ALL_PRO === "true",
};
