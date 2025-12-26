import { useState, useCallback } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type DownloadFormat = "markdown" | "pdf" | "html";

/**
 * Markdown ファイルのダウンロード機能を提供するフック
 */
export function useMarkdownDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Markdown 形式でダウンロード
  const downloadAsMarkdown = useCallback(
    async (fileName: string, content: string) => {
      try {
        setDownloading(true);
        setError(null);

        const fileUri = `${FileSystem.documentDirectory}${fileName}.md`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // 共有ダイアログを表示
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/markdown",
            dialogTitle: "Markdownファイルを共有",
          });
        } else {
          setError("ファイル共有機能が利用できません");
        }

        return fileUri;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "ダウンロードに失敗しました";
        setError(errorMsg);
        throw err;
      } finally {
        setDownloading(false);
      }
    },
    []
  );

  // HTML 形式でダウンロード
  const downloadAsHTML = useCallback(
    async (fileName: string, content: string, title: string = fileName) => {
      try {
        setDownloading(true);
        setError(null);

        // シンプルな HTML に変換
        const htmlContent = convertMarkdownToHTML(content, title);
        const fileUri = `${FileSystem.documentDirectory}${fileName}.html`;

        await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // 共有ダイアログを表示
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/html",
            dialogTitle: "HTMLファイルを共有",
          });
        } else {
          setError("ファイル共有機能が利用できません");
        }

        return fileUri;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "ダウンロードに失敗しました";
        setError(errorMsg);
        throw err;
      } finally {
        setDownloading(false);
      }
    },
    []
  );

  // テキスト形式でダウンロード（プレーンテキスト）
  const downloadAsText = useCallback(
    async (fileName: string, content: string) => {
      try {
        setDownloading(true);
        setError(null);

        const fileUri = `${FileSystem.documentDirectory}${fileName}.txt`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // 共有ダイアログを表示
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/plain",
            dialogTitle: "テキストファイルを共有",
          });
        } else {
          setError("ファイル共有機能が利用できません");
        }

        return fileUri;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "ダウンロードに失敗しました";
        setError(errorMsg);
        throw err;
      } finally {
        setDownloading(false);
      }
    },
    []
  );

  return {
    downloading,
    error,
    downloadAsMarkdown,
    downloadAsHTML,
    downloadAsText,
  };
}

/**
 * Markdown を HTML に変換する（シンプルな実装）
 */
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

  // HTML テンプレート
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
      background-color: #f9f9f9;
    }
    h1, h2, h3 {
      color: #0a7ea4;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.2em; }
    code {
      background-color: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      border-left: 4px solid #0a7ea4;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 5px;
    }
    p {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;
}
