import axios from "axios";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ENV } from "./env";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleOAuthStatePayload = {
  redirectUri: string;
  clientId: string;
  codeVerifier?: string;
};

export function encodeGoogleOAuthState(payload: GoogleOAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeGoogleOAuthState(state: string): GoogleOAuthStatePayload {
  const raw = Buffer.from(state, "base64url").toString("utf-8");
  const parsed = JSON.parse(raw) as GoogleOAuthStatePayload;
  if (
    !parsed ||
    typeof parsed.redirectUri !== "string" ||
    typeof parsed.clientId !== "string"
  ) {
    throw new Error("Invalid OAuth state");
  }
  return parsed;
}

export async function exchangeGoogleAuthorizationCode(opts: {
  code: string;
  redirectUri: string;
  clientId: string;
  codeVerifier?: string;
}): Promise<{ idToken: string }> {
  const params = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });
  if (opts.codeVerifier) {
    params.set("code_verifier", opts.codeVerifier);
  }
  const webId = ENV.googleWebClientId;
  const secret = ENV.googleClientSecret;
  if (secret && opts.clientId === webId) {
    params.set("client_secret", secret);
  }

  const { data } = await axios.post<{
    id_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  }>(GOOGLE_TOKEN_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 30_000,
  });

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  if (!data.id_token) {
    throw new Error("Google token response missing id_token");
  }
  return { idToken: data.id_token };
}

export async function verifyGoogleIdToken(
  idToken: string,
  audience: string,
): Promise<{ sub: string; email?: string; name?: string }> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience,
  });
  const sub = payload.sub;
  if (!sub) {
    throw new Error("id_token missing sub");
  }
  return {
    sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}

export function googleOpenId(sub: string): string {
  return `google:${sub}`;
}
