import { useEffect, useState, useCallback } from "react";

export interface MarkdownFile {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "markdown_files";
const DB_NAME = "MarkdownEditorDB";
const STORE_NAME = "files";

/**
 * Web版用のMarkdownファイル管理フック（IndexedDB対応）
 * ネイティブ版（AsyncStorage）との互換性を保つ
 */
export function useMarkdownFilesWeb() {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // IndexedDB の初期化
  const initDB = useCallback(async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        console.error("IndexedDB open error:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const database = request.result;
        resolve(database);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
    });
  }, []);

  // ファイルを読み込む
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // IndexedDB から読み込み
      if (db) {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const loadedFiles = request.result as MarkdownFile[];
          const sorted = loadedFiles.sort((a, b) => b.updatedAt - a.updatedAt);
          setFiles(sorted);
        };

        request.onerror = () => {
          console.error("Failed to load files from IndexedDB");
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "ファイルの読み込みに失敗しました";
      setError(errorMsg);
      console.error("Load files error:", err);
    } finally {
      setLoading(false);
    }
  }, [db]);

  // DB 初期化と ファイル読み込み
  useEffect(() => {
    const initialize = async () => {
      try {
        const database = await initDB();
        setDb(database);
      } catch (err) {
        console.error("DB initialization error:", err);
        setError("データベースの初期化に失敗しました");
        setLoading(false);
      }
    };

    initialize();
  }, [initDB]);

  // ファイル読み込み（DB 準備完了後）
  useEffect(() => {
    if (db) {
      loadFiles();
    }
  }, [db, loadFiles]);

  // 新規ファイルを作成
  const createFile = useCallback(
    async (name: string): Promise<MarkdownFile | null> => {
      if (!db) return null;

      try {
        const newFile: MarkdownFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          content: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(newFile);

        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            setFiles((prev) => [newFile, ...prev]);
            resolve(newFile);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (err) {
        console.error("Create file error:", err);
        return null;
      }
    },
    [db]
  );

  // ファイルの内容を更新
  const updateFileContent = useCallback(
    async (fileId: string, content: string): Promise<MarkdownFile | null> => {
      if (!db) return null;

      try {
        // IndexedDBからファイルを取得
        const getFilePromise = new Promise<MarkdownFile | null>((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(fileId);

          request.onsuccess = () => {
            resolve(request.result || null);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });

        const file = await getFilePromise;
        if (!file) {
          console.error("File not found:", fileId);
          return null;
        }

        const updatedFile: MarkdownFile = {
          ...file,
          content,
          updatedAt: Date.now(),
        };

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(updatedFile);

        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            setFiles((prev) =>
              prev
                .map((f) => (f.id === fileId ? updatedFile : f))
                .sort((a, b) => b.updatedAt - a.updatedAt)
            );
            resolve(updatedFile);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (err) {
        console.error("Update file error:", err);
        return null;
      }
    },
    [db]
  );

  // ファイルを削除
  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!db) return;

      try {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(fileId);

        return new Promise<void>((resolve, reject) => {
          request.onsuccess = () => {
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
            resolve();
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (err) {
        console.error("Delete file error:", err);
      }
    },
    [db]
  );

  // ファイル名を変更
  const renameFile = useCallback(
    async (fileId: string, newName: string): Promise<MarkdownFile | null> => {
      if (!db) return null;

      try {
        // IndexedDBからファイルを取得
        const getFilePromise = new Promise<MarkdownFile | null>((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(fileId);

          request.onsuccess = () => {
            resolve(request.result || null);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });

        const file = await getFilePromise;
        if (!file) {
          console.error("File not found:", fileId);
          return null;
        }

        const renamedFile: MarkdownFile = {
          ...file,
          name: newName,
          updatedAt: Date.now(),
        };

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(renamedFile);

        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            setFiles((prev) =>
              prev
                .map((f) => (f.id === fileId ? renamedFile : f))
                .sort((a, b) => b.updatedAt - a.updatedAt)
            );
            resolve(renamedFile);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (err) {
        console.error("Rename file error:", err);
        return null;
      }
    },
    [db]
  );

  // ID でファイルを取得
  const getFile = useCallback(
    (fileId: string): MarkdownFile | undefined => {
      return files.find((f) => f.id === fileId);
    },
    [files]
  );

  return {
    files,
    loading,
    error,
    createFile,
    updateFileContent,
    deleteFile,
    renameFile,
    getFile,
  };
}
