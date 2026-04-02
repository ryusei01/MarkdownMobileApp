import { Platform } from "react-native";
import { useCallback } from "react";
import { useMarkdownFiles } from "./use-markdown-files";
import { useMarkdownFilesWeb } from "./use-markdown-files-web";
import type { MarkdownFile } from "./use-markdown-files";
import { useMarkdownCloudSync } from "./use-markdown-cloud-sync";

/**
 * プラットフォーム別のファイル管理フック（ユニバーサル版）
 * - Web: IndexedDB
 * - iOS/Android: AsyncStorage
 * - Pro 契約時: クラウドとマージ・デバウンス同期
 */
export function useMarkdownFilesUniversal() {
  const isWeb = Platform.OS === "web";

  const nativeHook = useMarkdownFiles();
  const webHook = useMarkdownFilesWeb();

  const hook = isWeb ? webHook : nativeHook;

  const sync = useMarkdownCloudSync({
    files: hook.files,
    mergeRemoteFiles: hook.mergeRemoteFiles,
    deleteFile: hook.deleteFile,
    loading: hook.loading,
  });

  const deleteFile = useCallback(
    async (id: string) => {
      await hook.deleteFile(id);
      await sync.pushDeletesToServer(id);
    },
    [hook.deleteFile, sync.pushDeletesToServer],
  );

  return {
    files: hook.files,
    loading: hook.loading,
    error: hook.error,
    createFile: hook.createFile,
    updateFileContent: hook.updateFileContent,
    deleteFile,
    renameFile: hook.renameFile,
    getFile: hook.getFile,
    cloudSync: sync,
  };
}

export type { MarkdownFile };
