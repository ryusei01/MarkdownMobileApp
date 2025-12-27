import { Platform } from "react-native";
import { useMarkdownDownload } from "./use-markdown-download";
import { useMarkdownDownloadWeb } from "./use-markdown-download-web";

/**
 * プラットフォーム別のダウンロード機能フック（ユニバーサル版）
 * - Web: Blob + Web Share API を使用
 * - iOS/Android: expo-sharing を使用
 */
export function useMarkdownDownloadUniversal() {
  const isWeb = Platform.OS === "web";

  // プラットフォーム別に適切なフックを使用
  const nativeHook = useMarkdownDownload();
  const webHook = useMarkdownDownloadWeb();

  const hook = isWeb ? webHook : nativeHook;

  return {
    downloading: hook.downloading,
    error: hook.error,
    downloadAsMarkdown: hook.downloadAsMarkdown,
    downloadAsHTML: hook.downloadAsHTML,
    downloadAsText: hook.downloadAsText,
  };
}
