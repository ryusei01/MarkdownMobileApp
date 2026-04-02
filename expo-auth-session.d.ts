declare module "expo-auth-session" {
  export const ResponseType: { readonly Code: "code" };

  export class AuthRequest {
    codeVerifier?: string;
    constructor(options: {
      clientId: string;
      scopes: string[];
      redirectUri: string;
      responseType: string;
      usePKCE?: boolean;
    });
    makeAuthUrlAsync(discovery: { authorizationEndpoint: string }): Promise<void>;
    promptAsync(discovery: { authorizationEndpoint: string }): Promise<
      | { type: "success"; params: { code?: string } }
      | { type: "cancel" | "dismiss" | "error" }
    >;
  }
}
