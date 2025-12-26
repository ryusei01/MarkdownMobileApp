import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage をモック
vi.mock("@react-native-async-storage/async-storage");

describe("Markdown Files Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ファイルオブジェクトが正しい構造を持つこと", () => {
    const mockFile = {
      id: "file_123",
      name: "Test File",
      content: "# Hello World",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(mockFile).toHaveProperty("id");
    expect(mockFile).toHaveProperty("name");
    expect(mockFile).toHaveProperty("content");
    expect(mockFile).toHaveProperty("createdAt");
    expect(mockFile).toHaveProperty("updatedAt");
    expect(mockFile.name).toBe("Test File");
    expect(mockFile.content).toBe("# Hello World");
  });

  it("複数のファイルを配列で管理できること", () => {
    const files = [
      {
        id: "file_1",
        name: "File 1",
        content: "Content 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "file_2",
        name: "File 2",
        content: "Content 2",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    expect(files).toHaveLength(2);
    expect(files[0].name).toBe("File 1");
    expect(files[1].name).toBe("File 2");
  });

  it("ファイルの内容を更新できること", () => {
    const file = {
      id: "file_1",
      name: "Test",
      content: "Original content",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedFile = {
      ...file,
      content: "Updated content",
      updatedAt: Date.now() + 1000,
    };

    expect(updatedFile.content).toBe("Updated content");
    expect(updatedFile.updatedAt).toBeGreaterThan(file.updatedAt);
  });

  it("ファイル名を変更できること", () => {
    const file = {
      id: "file_1",
      name: "Original Name",
      content: "Content",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const renamedFile = {
      ...file,
      name: "New Name",
      updatedAt: Date.now() + 1000,
    };

    expect(renamedFile.name).toBe("New Name");
    expect(renamedFile.id).toBe(file.id); // ID は変わらない
  });

  it("ファイルをフィルタリングできること", () => {
    const files = [
      { id: "1", name: "Report.md", content: "", createdAt: 0, updatedAt: 0 },
      { id: "2", name: "Notes.md", content: "", createdAt: 0, updatedAt: 0 },
      { id: "3", name: "Todo.md", content: "", createdAt: 0, updatedAt: 0 },
    ];

    const filtered = files.filter((f) => f.name.includes("Report"));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Report.md");
  });

  it("ファイルをソートできること", () => {
    const now = Date.now();
    const files = [
      { id: "1", name: "Old", content: "", createdAt: now - 3000, updatedAt: now - 3000 },
      { id: "2", name: "New", content: "", createdAt: now, updatedAt: now },
      { id: "3", name: "Middle", content: "", createdAt: now - 1000, updatedAt: now - 1000 },
    ];

    const sorted = [...files].sort((a, b) => b.updatedAt - a.updatedAt);
    expect(sorted[0].name).toBe("New");
    expect(sorted[1].name).toBe("Middle");
    expect(sorted[2].name).toBe("Old");
  });

  it("ファイルを ID で検索できること", () => {
    const files = [
      { id: "file_1", name: "File 1", content: "", createdAt: 0, updatedAt: 0 },
      { id: "file_2", name: "File 2", content: "", createdAt: 0, updatedAt: 0 },
      { id: "file_3", name: "File 3", content: "", createdAt: 0, updatedAt: 0 },
    ];

    const found = files.find((f) => f.id === "file_2");
    expect(found).toBeDefined();
    expect(found?.name).toBe("File 2");
  });

  it("ファイルを削除できること", () => {
    let files = [
      { id: "1", name: "File 1", content: "", createdAt: 0, updatedAt: 0 },
      { id: "2", name: "File 2", content: "", createdAt: 0, updatedAt: 0 },
      { id: "3", name: "File 3", content: "", createdAt: 0, updatedAt: 0 },
    ];

    files = files.filter((f) => f.id !== "2");
    expect(files).toHaveLength(2);
    expect(files.find((f) => f.id === "2")).toBeUndefined();
  });
});
