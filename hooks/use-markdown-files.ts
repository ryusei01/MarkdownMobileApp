import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface MarkdownFile {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "markdown_files";

/**
 * Markdown ファイルの管理フック
 * AsyncStorage を使用してローカルにファイルを保存
 */
export function useMarkdownFiles() {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ファイル一覧を読み込む
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedFiles = JSON.parse(data) as MarkdownFile[];
        // 更新日時の降順でソート
        parsedFiles.sort((a, b) => b.updatedAt - a.updatedAt);
        setFiles(parsedFiles);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ファイルの読み込みに失敗しました");
      console.error("Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ファイルを保存
  const saveFile = useCallback(
    async (file: MarkdownFile) => {
      try {
        const updatedFiles = files.map((f) => (f.id === file.id ? file : f));
        if (!updatedFiles.find((f) => f.id === file.id)) {
          updatedFiles.push(file);
        }
        updatedFiles.sort((a, b) => b.updatedAt - a.updatedAt);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
        setFiles(updatedFiles);
        return file;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "ファイルの保存に失敗しました";
        setError(errorMsg);
        throw err;
      }
    },
    [files]
  );

  // 新規ファイルを作成
  const createFile = useCallback(
    async (name: string) => {
      const now = Date.now();
      const newFile: MarkdownFile = {
        id: `file_${now}`,
        name,
        content: "",
        createdAt: now,
        updatedAt: now,
      };
      return saveFile(newFile);
    },
    [saveFile]
  );

  // ファイルを削除
  const deleteFile = useCallback(
    async (id: string) => {
      try {
        const updatedFiles = files.filter((f) => f.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
        setFiles(updatedFiles);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "ファイルの削除に失敗しました";
        setError(errorMsg);
        throw err;
      }
    },
    [files]
  );

  // ファイル名を変更
  const renameFile = useCallback(
    async (id: string, newName: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) throw new Error("ファイルが見つかりません");
      return saveFile({ ...file, name: newName, updatedAt: Date.now() });
    },
    [files, saveFile]
  );

  // ファイルの内容を更新
  const updateFileContent = useCallback(
    async (id: string, content: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) throw new Error("ファイルが見つかりません");
      return saveFile({ ...file, content, updatedAt: Date.now() });
    },
    [files, saveFile]
  );

  // ファイルを ID で取得
  const getFile = useCallback(
    (id: string) => {
      return files.find((f) => f.id === id);
    },
    [files]
  );

  return {
    files,
    loading,
    error,
    loadFiles,
    saveFile,
    createFile,
    deleteFile,
    renameFile,
    updateFileContent,
    getFile,
  };
}
