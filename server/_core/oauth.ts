import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import {
  decodeGoogleOAuthState,
  exchangeGoogleAuthorizationCode,
  googleOpenId,
  verifyGoogleIdToken,
} from "./google-oauth";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function completeGoogleLogin(opts: {
  code: string;
  redirectUri: string;
  clientId: string;
  codeVerifier?: string;
  res: Response;
  req: Request;
  /** When true, redirect browser to SPA after setting cookie */
  isWebCallback: boolean;
}) {
  const { idToken } = await exchangeGoogleAuthorizationCode({
    code: opts.code,
    redirectUri: opts.redirectUri,
    clientId: opts.clientId,
    codeVerifier: opts.codeVerifier,
  });

  const profile = await verifyGoogleIdToken(idToken, opts.clientId);
  const openId = googleOpenId(profile.sub);

  await upsertUser({
    openId,
    name: profile.name || null,
    email: profile.email ?? null,
    loginMethod: "google",
    lastSignedIn: new Date(),
  });

  const user = await getUserByOpenId(openId);
  const sessionToken = await sdk.createSessionToken(openId, {
    name: profile.name || "",
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(opts.req);
  opts.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

  if (opts.isWebCallback) {
    const frontendUrl =
      process.env.EXPO_WEB_PREVIEW_URL ||
      process.env.EXPO_PACKAGER_PROXY_URL ||
      "http://localhost:8081";
    opts.res.redirect(302, frontendUrl);
    return;
  }

  opts.res.json({
    app_session_id: sessionToken,
    user: buildUserResponse(
      user ?? {
        openId,
        name: profile.name,
        email: profile.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      },
    ),
  });
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as { id?: number })?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const decoded = decodeGoogleOAuthState(state);
      await completeGoogleLogin({
        code,
        redirectUri: decoded.redirectUri,
        clientId: decoded.clientId,
        codeVerifier: decoded.codeVerifier,
        req,
        res,
        isWebCallback: true,
      });
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.post("/api/oauth/google/token", async (req: Request, res: Response) => {
    const body = req.body as {
      code?: string;
      redirectUri?: string;
      clientId?: string;
      codeVerifier?: string;
      state?: string;
    };

    try {
      let code = body.code;
      let redirectUri = body.redirectUri;
      let clientId = body.clientId;
      let codeVerifier = body.codeVerifier;

      if (body.state && (!code || !redirectUri || !clientId)) {
        const decoded = decodeGoogleOAuthState(body.state);
        redirectUri = redirectUri ?? decoded.redirectUri;
        clientId = clientId ?? decoded.clientId;
        codeVerifier = codeVerifier ?? decoded.codeVerifier;
      }

      if (!code || !redirectUri || !clientId) {
        res.status(400).json({ error: "code, redirectUri, and clientId are required" });
        return;
      }

      await completeGoogleLogin({
        code,
        redirectUri,
        clientId,
        codeVerifier,
        req,
        res,
        isWebCallback: false,
      });
    } catch (error) {
      console.error("[OAuth] Google token exchange failed", error);
      res.status(500).json({ error: "OAuth token exchange failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);

      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
