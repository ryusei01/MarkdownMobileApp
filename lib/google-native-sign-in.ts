import {
  getGoogleClientIdForCurrentPlatform,
  getGoogleRedirectUriForNative,
} from "@/constants/oauth";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
};

export type NativeGoogleSignInResult = {
  code: string;
  redirectUri: string;
  clientId: string;
  codeVerifier: string;
};

/**
 * iOS/Android: authorization code + PKCE via expo-auth-session.
 */
export async function signInWithGoogleNative(): Promise<NativeGoogleSignInResult> {
  const redirectUri = getGoogleRedirectUriForNative();
  const clientId = getGoogleClientIdForCurrentPlatform();
  if (!clientId) {
    throw new Error("Google client ID is not configured (EXPO_PUBLIC_GOOGLE_*).");
  }

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ["openid", "email", "profile"],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== "success") {
    throw new Error(result.type === "cancel" ? "User cancelled Google sign-in" : "Google sign-in failed");
  }

  const code = result.params.code;
  if (!code || !request.codeVerifier) {
    throw new Error("Google authorization response missing code or PKCE verifier");
  }

  return {
    code,
    redirectUri,
    clientId,
    codeVerifier: request.codeVerifier,
  };
}
