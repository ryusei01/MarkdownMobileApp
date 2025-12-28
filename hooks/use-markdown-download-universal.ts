import { Platform } from "react-native";
import { useMarkdownDownload } from "./use-markdown-download";
import { useMarkdownDownloadWeb } from "./use-markdown-download-web";

export type DownloadMethod = "share" | "local";

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

  if (isWeb) {
    // Web版: "local"を"download"に、"share"を"share"にマッピング
    return {
      downloading: webHook.downloading,
      error: webHook.error,
      downloadAsMarkdown: async (fileName: string, content: string, method: DownloadMethod = "local") => {
        const webMethod = method === "local" ? "download" : "share";
        return webHook.downloadAsMarkdown(fileName, content, webMethod);
      },
      downloadAsHTML: async (fileName: string, content: string, title: string = fileName, method: DownloadMethod = "local") => {
        const webMethod = method === "local" ? "download" : "share";
        return webHook.downloadAsHTML(fileName, content, title, webMethod);
      },
      downloadAsText: async (fileName: string, content: string, method: DownloadMethod = "local") => {
        const webMethod = method === "local" ? "download" : "share";
        return webHook.downloadAsText(fileName, content, webMethod);
      },
    };
  } else {
    // ネイティブ版: そのまま使用
    return {
      downloading: nativeHook.downloading,
      error: nativeHook.error,
      downloadAsMarkdown: nativeHook.downloadAsMarkdown,
      downloadAsHTML: nativeHook.downloadAsHTML,
      downloadAsText: nativeHook.downloadAsText,
    };
  }
}
