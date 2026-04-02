/**
 * 仮想フォルダ: MarkdownFile.name 内のスラッシュ区切りパス用ユーティリティ
 */

export function normalizeFilePath(name: string): string {
  return name
    .replace(/^\/+/u, "")
    .replace(/\/+/gu, "/")
    .trim();
}

export function getParentPath(fullName: string): string {
  const n = normalizeFilePath(fullName);
  const idx = n.lastIndexOf("/");
  if (idx <= 0) return "";
  return n.slice(0, idx);
}

export function getBaseName(fullName: string): string {
  const n = normalizeFilePath(fullName);
  const idx = n.lastIndexOf("/");
  return idx < 0 ? n : n.slice(idx + 1);
}

export function joinPath(folderPath: string, fileName: string): string {
  const fp = normalizeFilePath(folderPath);
  const base = fileName.replace(/^\/+/u, "").trim();
  if (!fp) return base;
  return `${fp}/${base}`;
}

/**
 * 指定フォルダ直下のサブフォルダ名（ソート済み）と .md ファイル一覧
 */
export function listChildrenAtFolder<
  T extends { name: string; updatedAt: number },
>(allFiles: T[], folderPath: string): { subfolders: string[]; files: T[] } {
  const fp = normalizeFilePath(folderPath);
  const subfolders = new Set<string>();
  const directFiles: T[] = [];

  for (const file of allFiles) {
    const name = normalizeFilePath(file.name);
    let rel: string;
    if (!fp) {
      rel = name;
    } else {
      if (name === fp) continue;
      if (!name.startsWith(`${fp}/`)) continue;
      rel = name.slice(fp.length + 1);
    }
    if (!rel) continue;
    const slash = rel.indexOf("/");
    if (slash === -1) {
      directFiles.push(file);
    } else {
      subfolders.add(rel.slice(0, slash));
    }
  }

  directFiles.sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    subfolders: Array.from(subfolders).sort((a, b) => a.localeCompare(b)),
    files: directFiles,
  };
}
