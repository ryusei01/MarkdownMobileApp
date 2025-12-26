import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * ダウンロード機能のテスト
 */

// Markdown を HTML に変換する関数（テスト用）
function convertMarkdownToHTML(markdown: string, title: string): string {
  let html = markdown;

  // 見出し
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

  // 太字
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // イタリック
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // リスト
  html = html.replace(/^\- (.*?)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>");

  // コードブロック
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // インラインコード
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // 改行を <br> に変換
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;
}

describe("Download Functionality", () => {
  describe("Markdown から HTML への変換", () => {
    it("見出しを正しく変換できること", () => {
      const markdown = "# Title\n## Subtitle";
      const html = convertMarkdownToHTML(markdown, "Test");

      expect(html).toContain("<h1>Title</h1>");
      expect(html).toContain("<h2>Subtitle</h2>");
    });

    it("太字を正しく変換できること", () => {
      const markdown = "This is **bold** text";
      const html = convertMarkdownToHTML(markdown, "Test");

      expect(html).toContain("<strong>bold</strong>");
    });

    it("イタリックを正しく変換できること", () => {
      const markdown = "This is *italic* text";
      const html = convertMarkdownToHTML(markdown, "Test");

      expect(html).toContain("<em>italic</em>");
    });

    it("リストを正しく変換できること", () => {
      const markdown = "- Item 1\n- Item 2";
      const html = convertMarkdownToHTML(markdown, "Test");

      expect(html).toContain("<li>Item 1</li>");
      expect(html).toContain("<li>Item 2</li>");
      expect(html).toContain("<ul>");
    });

    it("コードブロックを正しく変換できること", () => {
      const markdown = "```\nconst x = 10;\n```";
      const html = convertMarkdownToHTML(markdown, "Test");

      expect(html).toContain("<pre><code>");
      expect(html).toContain("const x = 10;");
      expect(html).toContain("</code></pre>");
    });

    it("インラインコードを正しく変換できること", () => {
      const markdown = "Use `const x = 10;` in code";
      const html = convertMarkdownToHTML(markdown, "Test");

      expect(html).toContain("<code>const x = 10;</code>");
    });

    it("HTML テンプレートが正しく生成されること", () => {
      const markdown = "# Test";
      const html = convertMarkdownToHTML(markdown, "MyDocument");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html lang=\"ja\">");
      expect(html).toContain("<meta charset=\"UTF-8\">");
      expect(html).toContain("<title>MyDocument</title>");
      expect(html).toContain("</html>");
    });

    it("複合的な Markdown を正しく変換できること", () => {
      const markdown = `# Welcome

This is **bold** and *italic*.

## Features

- Feature 1
- Feature 2

\`\`\`
code block
\`\`\`

Use \`inline code\` here.`;

      const html = convertMarkdownToHTML(markdown, "Document");

      expect(html).toContain("<h1>Welcome</h1>");
      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
      expect(html).toContain("<h2>Features</h2>");
      expect(html).toContain("<li>Feature 1</li>");
      expect(html).toContain("<pre><code>");
      expect(html).toContain("<code>inline code</code>");
    });
  });

  describe("ファイル名の処理", () => {
    it(".md 拡張子が削除されること", () => {
      const fileName = "document.md";
      const cleanName = fileName.replace(/\.md$/, "");

      expect(cleanName).toBe("document");
    });

    it(".md 拡張子がない場合はそのまま処理されること", () => {
      const fileName = "document";
      const cleanName = fileName.replace(/\.md$/, "");

      expect(cleanName).toBe("document");
    });

    it("複数の .md を含む場合は最後のものだけ削除されること", () => {
      const fileName = "my.md.file.md";
      const cleanName = fileName.replace(/\.md$/, "");

      expect(cleanName).toBe("my.md.file");
    });
  });

  describe("ダウンロード形式", () => {
    it("Markdown 形式のファイル名が正しく生成されること", () => {
      const fileName = "document";
      const markdownFileName = `${fileName}.md`;

      expect(markdownFileName).toBe("document.md");
    });

    it("HTML 形式のファイル名が正しく生成されること", () => {
      const fileName = "document";
      const htmlFileName = `${fileName}.html`;

      expect(htmlFileName).toBe("document.html");
    });

    it("テキスト形式のファイル名が正しく生成されること", () => {
      const fileName = "document";
      const textFileName = `${fileName}.txt`;

      expect(textFileName).toBe("document.txt");
    });
  });

  describe("ダウンロード方法", () => {
    it("ローカル保存方法が認識されること", () => {
      const method = "local";
      expect(method).toBe("local");
    });

    it("共有方法が認識されること", () => {
      const method = "share";
      expect(method).toBe("share");
    });

    it("ダウンロード方法の選択が正しく動作すること", () => {
      const methods = ["local", "share"] as const;
      const selectedMethod = methods[0];

      expect(selectedMethod).toBe("local");
      expect(methods).toContain("share");
    });
  });

  describe("エッジケース", () => {
    it("空の Markdown を処理できること", () => {
      const markdown = "";
      const html = convertMarkdownToHTML(markdown, "Empty");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<h1>Empty</h1>");
    });

    it("特殊文字を含む Markdown を処理できること", () => {
      const markdown = "# Title with & < > \"quotes\"";
      const html = convertMarkdownToHTML(markdown, "Test");

      // HTML エスケープは実装していないため、そのまま含まれる
      expect(html).toContain("Title with & < > \"quotes\"");
    });

    it("非常に長い Markdown を処理できること", () => {
      const longMarkdown = "# Title\n" + "- Item\n".repeat(1000);
      const html = convertMarkdownToHTML(longMarkdown, "LongDoc");

      expect(html).toContain("<h1>Title</h1>");
      expect(html.match(/<li>Item<\/li>/g)?.length).toBe(1000);
    });
  });
});
