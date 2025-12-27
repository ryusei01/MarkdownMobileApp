import { Platform } from "react-native";
import { useMarkdownFiles } from "./use-markdown-files";
import { useMarkdownFilesWeb } from "./use-markdown-files-web";
import type { MarkdownFile } from "./use-markdown-files";

/**
 * プラットフォーム別のファイル管理フック（ユニバーサル版）
 * - Web: IndexedDB を使用
 * - iOS/Android: AsyncStorage を使用
 */
export function useMarkdownFilesUniversal() {
  const isWeb = Platform.OS === "web";

  // プラットフォーム別に適切なフックを使用
  const nativeHook = useMarkdownFiles();
  const webHook = useMarkdownFilesWeb();

  const hook = isWeb ? webHook : nativeHook;

  return {
    files: hook.files,
    loading: hook.loading,
    error: hook.error,
    createFile: hook.createFile,
    updateFileContent: hook.updateFileContent,
    deleteFile: hook.deleteFile,
    renameFile: hook.renameFile,
    getFile: hook.getFile,
  };
}
