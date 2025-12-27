import { Platform } from "react-native";

/**
 * プラットフォーム判定ユーティリティ
 */

export const isWeb = Platform.OS === "web";
export const isNative = Platform.OS === "ios" || Platform.OS === "android";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

/**
 * プラットフォーム別の処理を実行
 */
export function runOnPlatform<T>(
  callbacks: {
    web?: () => T;
    ios?: () => T;
    android?: () => T;
    native?: () => T;
    default?: () => T;
  }
): T | undefined {
  if (isWeb && callbacks.web) return callbacks.web();
  if (isIOS && callbacks.ios) return callbacks.ios();
  if (isAndroid && callbacks.android) return callbacks.android();
  if (isNative && callbacks.native) return callbacks.native();
  if (callbacks.default) return callbacks.default();
  return undefined;
}

/**
 * Web API が利用可能か確認
 */
export const hasWebShare = typeof navigator !== "undefined" && !!navigator.share;
export const hasIndexedDB = typeof indexedDB !== "undefined";
export const hasLocalStorage = typeof localStorage !== "undefined";
export const hasClipboard = typeof navigator !== "undefined" && !!navigator.clipboard;
