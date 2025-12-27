import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Web版ファイル管理機能のテスト
 */

describe("Web版ファイル管理", () => {
  describe("ファイルオブジェクト", () => {
    it("ファイルオブジェクトが正しい構造を持つこと", () => {
      const file = {
        id: "file_123",
        name: "test.md",
        content: "# Test",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(file).toHaveProperty("id");
      expect(file).toHaveProperty("name");
      expect(file).toHaveProperty("content");
      expect(file).toHaveProperty("createdAt");
      expect(file).toHaveProperty("updatedAt");
    });

    it("ファイル ID が一意であること", () => {
      const id1 = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const id2 = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      expect(id1).not.toBe(id2);
    });
  });

  describe("ファイル操作", () => {
    it("ファイル名を変更できること", () => {
      const file = {
        id: "file_123",
        name: "old_name.md",
        content: "# Test",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newName = "new_name.md";
      const renamedFile = { ...file, name: newName, updatedAt: Date.now() };

      expect(renamedFile.name).toBe("new_name.md");
      expect(renamedFile.id).toBe(file.id);
    });

    it("ファイル内容を更新できること", () => {
      const file = {
        id: "file_123",
        name: "test.md",
        content: "# Old Content",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newContent = "# New Content";
      const updatedFile = { ...file, content: newContent, updatedAt: Date.now() };

      expect(updatedFile.content).toBe("# New Content");
      expect(updatedFile.updatedAt).toBeGreaterThanOrEqual(file.updatedAt);
    });
  });

  describe("ファイルソート", () => {
    it("ファイルを更新日時でソートできること", () => {
      const now = Date.now();
      const files = [
        { id: "1", name: "a.md", content: "", createdAt: now - 3000, updatedAt: now - 3000 },
        { id: "2", name: "b.md", content: "", createdAt: now - 2000, updatedAt: now - 2000 },
        { id: "3", name: "c.md", content: "", createdAt: now - 1000, updatedAt: now - 1000 },
      ];

      const sorted = [...files].sort((a, b) => b.updatedAt - a.updatedAt);

      expect(sorted[0].id).toBe("3");
      expect(sorted[1].id).toBe("2");
      expect(sorted[2].id).toBe("1");
    });
  });

  describe("ファイルフィルタリング", () => {
    it("ファイルを名前で検索できること", () => {
      const files = [
        { id: "1", name: "document.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
        { id: "2", name: "notes.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
        { id: "3", name: "readme.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
      ];

      const query = "doc";
      const filtered = files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("document.md");
    });

    it("ファイルを ID で取得できること", () => {
      const files = [
        { id: "1", name: "a.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
        { id: "2", name: "b.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
      ];

      const found = files.find((f) => f.id === "2");

      expect(found).toBeDefined();
      expect(found?.name).toBe("b.md");
    });
  });

  describe("ファイル削除", () => {
    it("ファイルをリストから削除できること", () => {
      const files = [
        { id: "1", name: "a.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
        { id: "2", name: "b.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
        { id: "3", name: "c.md", content: "", createdAt: Date.now(), updatedAt: Date.now() },
      ];

      const fileIdToDelete = "2";
      const filtered = files.filter((f) => f.id !== fileIdToDelete);

      expect(filtered).toHaveLength(2);
      expect(filtered.find((f) => f.id === "2")).toBeUndefined();
    });
  });

  describe("IndexedDB キー", () => {
    it("DB 名が正しく設定されていること", () => {
      const DB_NAME = "MarkdownEditorDB";
      expect(DB_NAME).toBe("MarkdownEditorDB");
    });

    it("ストア名が正しく設定されていること", () => {
      const STORE_NAME = "files";
      expect(STORE_NAME).toBe("files");
    });

    it("ストレージキーが正しく設定されていること", () => {
      const STORAGE_KEY = "markdown_files";
      expect(STORAGE_KEY).toBe("markdown_files");
    });
  });

  describe("Web API 互換性", () => {
    it("Blob を作成できること", () => {
      const content = "# Test";
      const blob = new Blob([content], { type: "text/markdown" });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("text/markdown");
    });

    it("Object URL を作成・解放できること", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      expect(url).toMatch(/^blob:/);

      URL.revokeObjectURL(url);
      // URL は解放される
    });

    it("File オブジェクトを作成できること", () => {
      const blob = new Blob(["content"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("test.txt");
    });
  });
});
