/**
 * Markdownファイル管理フック
 * AsyncStorageを使用してローカルストレージにファイルを保存・管理
 */

import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Markdownファイルのデータ構造
 */
export interface MarkdownFile {
  id: string; // ファイルの一意なID
  name: string; // ファイル名
  content: string; // ファイルの内容（Markdownテキスト）
  createdAt: number; // 作成日時（タイムスタンプ）
  updatedAt: number; // 更新日時（タイムスタンプ）
}

// AsyncStorageのキー
const STORAGE_KEY = "markdown_files";

/**
 * Markdownファイルの管理フック
 * AsyncStorageを使用してローカルにファイルを保存
 * @returns ファイル一覧、読み込み状態、CRUD操作関数
 */
export function useMarkdownFiles() {
  // 状態管理
  const [files, setFiles] = useState<MarkdownFile[]>([]); // ファイル一覧
  const [loading, setLoading] = useState(true); // 読み込み中フラグ
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  /**
   * AsyncStorageからファイル一覧を読み込む
   * 更新日時の降順でソート
   */
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

  // コンポーネントマウント時にファイル一覧を読み込む
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  /**
   * ファイルを保存（新規作成または更新）
   * @param file - 保存するファイルオブジェクト
   * @returns 保存したファイルオブジェクト
   */
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

  /**
   * 新規ファイルを作成
   * @param name - ファイル名
   * @returns 作成したファイルオブジェクト
   */
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

  /**
   * ファイルを削除
   * @param id - 削除するファイルのID
   */
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

  /**
   * ファイル名を変更
   * @param id - ファイルのID
   * @param newName - 新しいファイル名
   * @returns 更新したファイルオブジェクト
   */
  const renameFile = useCallback(
    async (id: string, newName: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) throw new Error("ファイルが見つかりません");
      return saveFile({ ...file, name: newName, updatedAt: Date.now() });
    },
    [files, saveFile]
  );

  /**
   * ファイルの内容を更新
   * @param id - ファイルのID
   * @param content - 新しいコンテンツ
   * @returns 更新したファイルオブジェクト
   */
  const updateFileContent = useCallback(
    async (id: string, content: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) throw new Error("ファイルが見つかりません");
      return saveFile({ ...file, content, updatedAt: Date.now() });
    },
    [files, saveFile]
  );

  /**
   * ファイルをIDで取得
   * @param id - ファイルのID
   * @returns ファイルオブジェクト（見つからない場合はundefined）
   */
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
