import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystemUtils from "@/lib/file-system-utils";

export interface MarkdownFile {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "markdown_files_metadata";

/**
 * ネイティブ版（iOS/Android）のMarkdownファイル管理フック
 * メタデータは AsyncStorage に、ファイル内容はファイルシステムに保存
 */
export function useMarkdownFilesNative() {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ファイルメタデータを読み込む
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // AsyncStorage からメタデータを読み込む
      const metadata = await AsyncStorage.getItem(STORAGE_KEY);
      if (metadata) {
        const parsedFiles: MarkdownFile[] = JSON.parse(metadata);
        const sorted = parsedFiles.sort((a, b) => b.updatedAt - a.updatedAt);
        setFiles(sorted);
      } else {
        setFiles([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "ファイルの読み込みに失敗しました";
      setError(errorMsg);
      console.error("Load files error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期化
  useEffect(() => {
    loadFiles();
    FileSystemUtils.initializeAppDirectory();
  }, [loadFiles]);

  // メタデータを保存
  const saveMetadata = useCallback(async (fileList: MarkdownFile[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fileList));
    } catch (err) {
      console.error("Failed to save metadata:", err);
    }
  }, []);

  // 新規ファイルを作成
  const createFile = useCallback(
    async (name: string): Promise<MarkdownFile | null> => {
      try {
        const newFile: MarkdownFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          content: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // ファイルシステムに保存
        await FileSystemUtils.saveFile(newFile.id, "");

        // メタデータを更新
        const updatedFiles = [newFile, ...files];
        await saveMetadata(updatedFiles);
        setFiles(updatedFiles);

        return newFile;
      } catch (err) {
        console.error("Create file error:", err);
        return null;
      }
    },
    [files, saveMetadata]
  );

  // ファイルの内容を更新
  const updateFileContent = useCallback(
    async (fileId: string, content: string): Promise<MarkdownFile | null> => {
      try {
        const file = files.find((f) => f.id === fileId);
        if (!file) return null;

        // ファイルシステムに保存
        await FileSystemUtils.saveFile(fileId, content);

        // メタデータを更新
        const updatedFile: MarkdownFile = {
          ...file,
          content,
          updatedAt: Date.now(),
        };

        const updatedFiles = files
          .map((f) => (f.id === fileId ? updatedFile : f))
          .sort((a, b) => b.updatedAt - a.updatedAt);

        await saveMetadata(updatedFiles);
        setFiles(updatedFiles);

        return updatedFile;
      } catch (err) {
        console.error("Update file error:", err);
        return null;
      }
    },
    [files, saveMetadata]
  );

  // ファイルを削除
  const deleteFile = useCallback(
    async (fileId: string) => {
      try {
        // ファイルシステムから削除
        await FileSystemUtils.deleteFile(fileId);

        // メタデータを更新
        const updatedFiles = files.filter((f) => f.id !== fileId);
        await saveMetadata(updatedFiles);
        setFiles(updatedFiles);
      } catch (err) {
        console.error("Delete file error:", err);
      }
    },
    [files, saveMetadata]
  );

  // ファイル名を変更
  const renameFile = useCallback(
    async (fileId: string, newName: string): Promise<MarkdownFile | null> => {
      try {
        const file = files.find((f) => f.id === fileId);
        if (!file) return null;

        // メタデータを更新
        const renamedFile: MarkdownFile = {
          ...file,
          name: newName,
          updatedAt: Date.now(),
        };

        const updatedFiles = files
          .map((f) => (f.id === fileId ? renamedFile : f))
          .sort((a, b) => b.updatedAt - a.updatedAt);

        await saveMetadata(updatedFiles);
        setFiles(updatedFiles);

        return renamedFile;
      } catch (err) {
        console.error("Rename file error:", err);
        return null;
      }
    },
    [files, saveMetadata]
  );

  // ID でファイルを取得
  const getFile = useCallback(
    (fileId: string): MarkdownFile | undefined => {
      return files.find((f) => f.id === fileId);
    },
    [files]
  );

  // ファイル内容を読み込む
  const loadFileContent = useCallback(async (fileId: string): Promise<string | null> => {
    try {
      const content = await FileSystemUtils.readFile(fileId);
      return content;
    } catch (err) {
      console.error("Load file content error:", err);
      return null;
    }
  }, []);

  return {
    files,
    loading,
    error,
    createFile,
    updateFileContent,
    deleteFile,
    renameFile,
    getFile,
    loadFileContent,
  };
}
