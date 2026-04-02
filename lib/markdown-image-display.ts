/**
 * プレビュー用: data URL が長すぎる場合の短縮表示
 */
const DATA_URI_PREFIX = /^data:image\/[^;]+;base64,/i;

export function truncateImageMarkdownLineForDisplay(line: string, maxLen = 120): string {
  const trimmed = line.trim();
  const m = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!m) return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
  const alt = m[1];
  let url = m[2];
  if (DATA_URI_PREFIX.test(url) && url.length > 64) {
    const head = url.slice(0, 48);
    url = `${head}…(base64省略)`;
  } else if (url.length > maxLen) {
    url = `${url.slice(0, maxLen)}…`;
  }
  return `![${alt}](${url})`;
}

export function parseImageOnlyLine(line: string): { alt: string; uri: string; raw: string } | null {
  const t = line.trim();
  const m = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!m) return null;
  return { alt: m[1], uri: m[2], raw: t };
}
