export type GoogleOAuthStatePayload = {
  redirectUri: string;
  clientId: string;
  codeVerifier?: string;
};

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const BufferImpl = (globalThis as { Buffer?: { from: (d: Uint8Array) => { toString: (enc: string) => string } } })
    .Buffer;
  if (BufferImpl) {
    return BufferImpl.from(bytes).toString("base64url");
  }
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  const b64 = globalThis.btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function encodeGoogleOAuthState(payload: GoogleOAuthStatePayload): string {
  return utf8ToBase64Url(JSON.stringify(payload));
}
