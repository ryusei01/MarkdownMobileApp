declare module "expo-image-picker" {
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: string; granted: boolean }>;

  export function launchImageLibraryAsync(options?: {
    mediaTypes?: Array<"images">;
    quality?: number;
    base64?: boolean;
    allowsMultipleSelection?: boolean;
  }): Promise<{
    canceled: boolean;
    assets?: Array<{ uri: string; base64?: string; mimeType?: string | null }>;
  }>;
}
