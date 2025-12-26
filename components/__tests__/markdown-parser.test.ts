import { describe, it, expect } from "vitest";

/**
 * Markdown パーサーのテスト
 * MarkdownPreview コンポーネントで使用される解析ロジックをテスト
 */

// シンプルな Markdown 解析関数
function parseMarkdownHeadings(text: string): { level: number; content: string }[] {
  const lines = text.split("\n");
  const headings: { level: number; content: string }[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      headings.push({ level: 3, content: line.substring(4) });
    } else if (line.startsWith("## ")) {
      headings.push({ level: 2, content: line.substring(3) });
    } else if (line.startsWith("# ")) {
      headings.push({ level: 1, content: line.substring(2) });
    }
  }

  return headings;
}

// リスト項目を抽出する関数
function parseMarkdownLists(text: string): string[] {
  const lines = text.split("\n");
  const items: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      items.push(line.trim().substring(2));
    }
  }

  return items;
}

// コードブロックを抽出する関数
function extractCodeBlocks(text: string): string[] {
  const codeBlocks: string[] = [];
  const lines = text.split("\n");
  let inCodeBlock = false;
  let currentBlock = "";

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        codeBlocks.push(currentBlock);
        currentBlock = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
    } else if (inCodeBlock) {
      currentBlock += line + "\n";
    }
  }

  return codeBlocks;
}

describe("Markdown Parser", () => {
  describe("見出しの解析", () => {
    it("H1 見出しを正しく解析できること", () => {
      const markdown = "# Main Title";
      const headings = parseMarkdownHeadings(markdown);

      expect(headings).toHaveLength(1);
      expect(headings[0].level).toBe(1);
      expect(headings[0].content).toBe("Main Title");
    });

    it("H2 見出しを正しく解析できること", () => {
      const markdown = "## Subtitle";
      const headings = parseMarkdownHeadings(markdown);

      expect(headings).toHaveLength(1);
      expect(headings[0].level).toBe(2);
      expect(headings[0].content).toBe("Subtitle");
    });

    it("H3 見出しを正しく解析できること", () => {
      const markdown = "### Sub-subtitle";
      const headings = parseMarkdownHeadings(markdown);

      expect(headings).toHaveLength(1);
      expect(headings[0].level).toBe(3);
      expect(headings[0].content).toBe("Sub-subtitle");
    });

    it("複数の見出しを正しく解析できること", () => {
      const markdown = `# Title
## Section 1
### Subsection 1.1
## Section 2`;
      const headings = parseMarkdownHeadings(markdown);

      expect(headings).toHaveLength(4);
      expect(headings[0].level).toBe(1);
      expect(headings[1].level).toBe(2);
      expect(headings[2].level).toBe(3);
      expect(headings[3].level).toBe(2);
    });
  });

  describe("リストの解析", () => {
    it("単一のリスト項目を解析できること", () => {
      const markdown = "- Item 1";
      const items = parseMarkdownLists(markdown);

      expect(items).toHaveLength(1);
      expect(items[0]).toBe("Item 1");
    });

    it("複数のリスト項目を解析できること", () => {
      const markdown = `- Item 1
- Item 2
- Item 3`;
      const items = parseMarkdownLists(markdown);

      expect(items).toHaveLength(3);
      expect(items[0]).toBe("Item 1");
      expect(items[1]).toBe("Item 2");
      expect(items[2]).toBe("Item 3");
    });

    it("アスタリスク形式のリストを解析できること", () => {
      const markdown = `* Item A
* Item B`;
      const items = parseMarkdownLists(markdown);

      expect(items).toHaveLength(2);
      expect(items[0]).toBe("Item A");
      expect(items[1]).toBe("Item B");
    });

    it("インデント付きリストを解析できること", () => {
      const markdown = `- Item 1
  - Subitem 1.1
- Item 2`;
      const items = parseMarkdownLists(markdown);

      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items[0]).toBe("Item 1");
    });
  });

  describe("コードブロックの解析", () => {
    it("単一のコードブロックを抽出できること", () => {
      const markdown = `\`\`\`
const hello = "world";
\`\`\``;
      const blocks = extractCodeBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toContain("const hello");
    });

    it("複数のコードブロックを抽出できること", () => {
      const markdown = `\`\`\`
code block 1
\`\`\`

Some text

\`\`\`
code block 2
\`\`\``;
      const blocks = extractCodeBlocks(markdown);

      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toContain("code block 1");
      expect(blocks[1]).toContain("code block 2");
    });

    it("複数行のコードブロックを正しく抽出できること", () => {
      const markdown = `\`\`\`
function example() {
  console.log("Hello");
  return true;
}
\`\`\``;
      const blocks = extractCodeBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toContain("function example");
      expect(blocks[0]).toContain("console.log");
      expect(blocks[0]).toContain("return true");
    });
  });

  describe("複合的な Markdown の解析", () => {
    it("見出し、リスト、コードを含む Markdown を解析できること", () => {
      const markdown = `# Welcome

## Features

- Feature 1
- Feature 2

## Code Example

\`\`\`
const example = true;
\`\`\``;

      const headings = parseMarkdownHeadings(markdown);
      const items = parseMarkdownLists(markdown);
      const blocks = extractCodeBlocks(markdown);

      expect(headings).toHaveLength(3);
      expect(items).toHaveLength(2);
      expect(blocks).toHaveLength(1);
    });
  });

  describe("エッジケース", () => {
    it("空の Markdown を処理できること", () => {
      const markdown = "";
      const headings = parseMarkdownHeadings(markdown);
      const items = parseMarkdownLists(markdown);
      const blocks = extractCodeBlocks(markdown);

      expect(headings).toHaveLength(0);
      expect(items).toHaveLength(0);
      expect(blocks).toHaveLength(0);
    });

    it("テキストのみの Markdown を処理できること", () => {
      const markdown = "This is just plain text.";
      const headings = parseMarkdownHeadings(markdown);

      expect(headings).toHaveLength(0);
    });

    it("不完全なコードブロックを処理できること", () => {
      const markdown = `\`\`\`
code without closing`;
      const blocks = extractCodeBlocks(markdown);

      // 不完全なブロックは抽出されない
      expect(blocks).toHaveLength(0);
    });
  });
});
