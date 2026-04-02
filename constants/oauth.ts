import * as Linking from "expo-linking";
import * as ReactNative from "react-native";
import { encodeGoogleOAuthState } from "@/lib/google-oauth-state";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
const bundleId = "space.manus.MarkdownMobileApp.t20251226011757";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  ownerOpenId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const GOOGLE_WEB_CLIENT_ID = env.googleWebClientId;
export const OWNER_OPEN_ID = env.ownerOpenId;
export const API_BASE_URL = env.apiBaseUrl;

export function getGoogleClientIdForCurrentPlatform(): string {
  if (ReactNative.Platform.OS === "web") {
    return env.googleWebClientId;
  }
  if (ReactNative.Platform.OS === "ios") {
    return env.googleIosClientId || env.googleWebClientId;
  }
  return env.googleAndroidClientId || env.googleWebClientId;
}

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 */
export function getApiBaseUrl(): string {
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  return "";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

/** Web: Google redirects here (API server). Must match Google Cloud console. */
export function getGoogleRedirectUriForWeb(): string {
  return `${getApiBaseUrl()}/api/oauth/callback`;
}

/** Native: deep link back to the app (expo-router oauth callback). */
export function getGoogleRedirectUriForNative(): string {
  return Linking.createURL("/oauth/callback", {
    scheme: env.deepLinkScheme,
  });
}

export function buildGoogleOAuthState(redirectUri: string, codeVerifier?: string): string {
  const clientId = getGoogleClientIdForCurrentPlatform();
  return encodeGoogleOAuthState({ redirectUri, clientId, codeVerifier });
}

/**
 * Browser redirect: sign in with Google (authorization code flow, no PKCE).
 */
export function getWebGoogleLoginUrl(): string {
  const redirectUri = getGoogleRedirectUriForWeb();
  const clientId = env.googleWebClientId;
  const state = buildGoogleOAuthState(redirectUri);
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}
