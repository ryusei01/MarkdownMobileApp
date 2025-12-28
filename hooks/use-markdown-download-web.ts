import { useState, useCallback } from "react";
import { Platform } from "react-native";

export type DownloadFormat = "markdown" | "pdf" | "html";
export type DownloadMethod = "download" | "share" | "local";

/**
 * Web版用のMarkdownダウンロード機能フック
 */
export function useMarkdownDownloadWeb() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイルをダウンロード
  const downloadFile = useCallback(
    (fileName: string, content: string, mimeType: string = "text/plain") => {
      try {
        setDownloading(true);
        setError(null);

        // Blob を作成
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // リンクを作成してクリック
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // URL を解放
        URL.revokeObjectURL(url);

        console.log("File downloaded:", fileName);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "ダウンロードに失敗しました";
        setError(errorMsg);
        console.error("Download error:", err);
        return false;
      } finally {
        setDownloading(false);
      }
    },
    []
  );

  // Web Share API を使用して共有
  const shareFile = useCallback(
    async (fileName: string, content: string, mimeType: string = "text/plain") => {
      try {
        setDownloading(true);
        setError(null);

        // Web Share API が利用可能か確認
        if (!navigator.share) {
          // Web Share APIが利用できない場合は、ダウンロードにフォールバック
          console.warn("Web Share API が利用できません。ダウンロードにフォールバックします。");
          const result = downloadFile(fileName, content, mimeType);
          return result;
        }

        // ファイルを Blob に変換
        const blob = new Blob([content], { type: mimeType });
        const file = new File([blob], fileName, { type: mimeType });

        // まずファイル共有を試みる（サポートされているブラウザのみ）
        try {
          // navigator.canShare でファイル共有が可能か確認
          const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
          
          if (canShareFiles) {
            await navigator.share({
              files: [file],
              title: fileName,
              text: `${fileName} を共有します`,
            });
            console.log("File shared:", fileName);
            return true;
          }
        } catch (fileShareError: any) {
          // ファイル共有が失敗した場合（NotSupportedErrorなど）
          console.log("ファイル共有がサポートされていません。テキスト共有を試みます。", fileShareError);
        }

        // ファイル共有ができない場合は、テキストとして共有を試みる
        // コンテンツが長すぎる場合は切り詰める
        const maxTextLength = 10000;
        const shareText = content.length > maxTextLength 
          ? content.substring(0, maxTextLength) + "\n\n... (内容が長いため一部のみ表示)"
          : content;

        try {
          await navigator.share({
            title: fileName,
            text: shareText,
          });
          console.log("Content shared as text:", fileName);
          return true;
        } catch (textShareError: any) {
          // テキスト共有も失敗した場合は、ダウンロードにフォールバック
          if (textShareError.name === "AbortError") {
            // ユーザーがキャンセルした場合はエラーにしない
            return false;
          }
          console.log("テキスト共有も失敗しました。ダウンロードにフォールバックします。", textShareError);
          const result = downloadFile(fileName, content, mimeType);
          return result;
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          const errorMsg = err.message;
          setError(errorMsg);
          console.error("Share error:", err);
          // エラーが発生した場合も、ダウンロードにフォールバック
          try {
            const result = downloadFile(fileName, content, mimeType);
            return result;
          } catch (downloadError) {
            console.error("Fallback download also failed:", downloadError);
            return false;
          }
        }
        return false;
      } finally {
        setDownloading(false);
      }
    },
    [downloadFile]
  );

  // Markdown 形式でダウンロード
  const downloadAsMarkdown = useCallback(
    async (fileName: string, content: string, method: DownloadMethod = "download") => {
      const cleanFileName = fileName.replace(/\.md$/, "");
      const fileNameWithExt = `${cleanFileName}.md`;

      if (method === "download" || method === "local") {
        const result = downloadFile(fileNameWithExt, content, "text/markdown");
        if (!result) {
          throw new Error("ダウンロードに失敗しました");
        }
        return fileNameWithExt;
      } else {
        const result = await shareFile(fileNameWithExt, content, "text/markdown");
        if (!result) {
          throw new Error("共有に失敗しました");
        }
        return fileNameWithExt;
      }
    },
    [downloadFile, shareFile]
  );

  // HTML 形式でダウンロード
  const downloadAsHTML = useCallback(
    async (fileName: string, content: string, title: string = fileName, method: DownloadMethod = "download") => {
      const cleanFileName = fileName.replace(/\.md$/, "");
      const fileNameWithExt = `${cleanFileName}.html`;
      const htmlContent = convertMarkdownToHTML(content, title);

      if (method === "download" || method === "local") {
        const result = downloadFile(fileNameWithExt, htmlContent, "text/html");
        if (!result) {
          throw new Error("ダウンロードに失敗しました");
        }
        return fileNameWithExt;
      } else {
        const result = await shareFile(fileNameWithExt, htmlContent, "text/html");
        if (!result) {
          throw new Error("共有に失敗しました");
        }
        return fileNameWithExt;
      }
    },
    [downloadFile, shareFile]
  );

  // テキスト形式でダウンロード
  const downloadAsText = useCallback(
    async (fileName: string, content: string, method: DownloadMethod = "download") => {
      const cleanFileName = fileName.replace(/\.md$/, "");
      const fileNameWithExt = `${cleanFileName}.txt`;

      if (method === "download" || method === "local") {
        const result = downloadFile(fileNameWithExt, content, "text/plain");
        if (!result) {
          throw new Error("ダウンロードに失敗しました");
        }
        return fileNameWithExt;
      } else {
        const result = await shareFile(fileNameWithExt, content, "text/plain");
        if (!result) {
          throw new Error("共有に失敗しました");
        }
        return fileNameWithExt;
      }
    },
    [downloadFile, shareFile]
  );

  return {
    downloading,
    error,
    downloadAsMarkdown,
    downloadAsHTML,
    downloadAsText,
    downloadFile,
    shareFile,
  };
}

/**
 * Markdown を HTML に変換する（Web版）
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
