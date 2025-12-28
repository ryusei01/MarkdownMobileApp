/**
 * Markdownプレビューコンポーネント
 * MarkdownテキストをパースしてReact Nativeのコンポーネントに変換して表示
 */

import React from "react";
import { ScrollView, Text, View, Image, Linking } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

/**
 * MarkdownPreviewコンポーネントのプロパティ
 */
interface MarkdownPreviewProps {
  content: string; // 表示するMarkdownコンテンツ
  className?: string; // 追加のCSSクラス名
}

/**
 * Markdownプレビューコンポーネント
 * 基本的なMarkdown構文（見出し、太字、イタリック、リスト、コードブロックなど）をレンダリング
 * @param content - 表示するMarkdownテキスト
 * @param className - 追加のスタイルクラス
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const colors = useColors();

  /**
   * テキスト内のインライン要素（リンク、画像、太字、イタリック、インラインコード）をパース
   * @param text - パースするテキスト
   * @param keyPrefix - キーのプレフィックス
   * @returns React要素の配列
   */
  const parseInlineElements = (text: string, keyPrefix: string): React.ReactNode[] => {
    if (!text) return [text];

    const elements: React.ReactNode[] = [];
    let elementIndex = 0;

    // すべてのマッチを収集（優先順位: 画像 > リンク > コード > 太字 > イタリック）
    const allMatches: Array<{
      type: "image" | "link" | "bold" | "italic" | "code";
      index: number;
      length: number;
      data: any;
    }> = [];

    // 画像を先に処理（![alt](url)）
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let imageMatch;
    while ((imageMatch = imageRegex.exec(text)) !== null) {
      allMatches.push({
        type: "image",
        index: imageMatch.index,
        length: imageMatch[0].length,
        data: { alt: imageMatch[1], url: imageMatch[2] },
      });
    }

    // リンクを処理（[text](url)）- 画像でないもの
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      // 画像のリンク部分はスキップ
      if (linkMatch.index > 0 && text[linkMatch.index - 1] === "!") continue;
      allMatches.push({
        type: "link",
        index: linkMatch.index,
        length: linkMatch[0].length,
        data: { text: linkMatch[1], url: linkMatch[2] },
      });
    }

    // インラインコードを処理（`code`）- 他の要素より優先
    const codeRegex = /`([^`]+)`/g;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(text)) !== null) {
      allMatches.push({
        type: "code",
        index: codeMatch.index,
        length: codeMatch[0].length,
        data: { code: codeMatch[1] },
      });
    }

    // 太字を処理（**text** または __text__）
    const boldRegex = /(\*\*|__)(.+?)\1/g;
    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      allMatches.push({
        type: "bold",
        index: boldMatch.index,
        length: boldMatch[0].length,
        data: { text: boldMatch[2] },
      });
    }

    // イタリックを処理（*text* または _text_）- 太字でないもの
    // 単一の*または_で囲まれたもの（**で囲まれたものは太字として既に処理済み）
    const italicRegex = /(?<!\*)\*([^*\n]+?)\*(?!\*)|(?<!_)_([^_\n]+?)_(?!_)/g;
    let italicMatch;
    while ((italicMatch = italicRegex.exec(text)) !== null) {
      // 太字やコードの一部でないことを確認
      const isPartOfOther = allMatches.some(
        (m) => italicMatch.index >= m.index && italicMatch.index < m.index + m.length,
      );
      if (!isPartOfOther) {
        allMatches.push({
          type: "italic",
          index: italicMatch.index,
          length: italicMatch[0].length,
          data: { text: italicMatch[1] || italicMatch[2] },
        });
      }
    }

    // すべてのマッチをインデックス順にソート
    allMatches.sort((a, b) => a.index - b.index);

    // 重複を除去（より長いマッチを優先）
    const filteredMatches: typeof allMatches = [];
    for (let i = 0; i < allMatches.length; i++) {
      const current = allMatches[i];
      let hasOverlap = false;
      for (let j = 0; j < filteredMatches.length; j++) {
        const existing = filteredMatches[j];
        if (
          (current.index >= existing.index && current.index < existing.index + existing.length) ||
          (existing.index >= current.index && existing.index < current.index + current.length)
        ) {
          hasOverlap = true;
          // より長い方を優先
          if (current.length > existing.length) {
            filteredMatches[j] = current;
          }
          break;
        }
      }
      if (!hasOverlap) {
        filteredMatches.push(current);
      }
    }
    filteredMatches.sort((a, b) => a.index - b.index);

    // テキストを処理
    let lastIndex = 0;
    filteredMatches.forEach((match) => {
      // マッチ前のテキストを追加
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          elements.push(beforeText);
        }
      }

      // マッチした要素を追加
      if (match.type === "image") {
        const { alt, url } = match.data;
        elements.push(
          <View key={`${keyPrefix}-img-${elementIndex}`} testID={`${keyPrefix}-image-${elementIndex}`}>
            <Image
              source={{ uri: url }}
              style={{ width: "100%", height: 200, resizeMode: "contain", marginVertical: 8 }}
              className="rounded-lg"
            />
            {alt && (
              <Text className="text-xs text-muted text-center mb-2" testID={`${keyPrefix}-image-alt-${elementIndex}`}>
                {alt}
              </Text>
            )}
          </View>
        );
      } else if (match.type === "link") {
        const { text: linkText, url } = match.data;
        elements.push(
          <Text
            key={`${keyPrefix}-link-${elementIndex}`}
            className="text-primary underline"
            onPress={() => Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err))}
            testID={`${keyPrefix}-link-${elementIndex}`}
          >
            {linkText}
          </Text>
        );
      } else if (match.type === "bold") {
        const { text: boldText } = match.data;
        elements.push(
          <Text key={`${keyPrefix}-bold-${elementIndex}`} className="font-bold">
            {boldText}
          </Text>
        );
      } else if (match.type === "code") {
        const { code } = match.data;
        elements.push(
          <Text
            key={`${keyPrefix}-code-${elementIndex}`}
            className="bg-surface px-1 py-0.5 rounded font-mono text-sm text-primary"
          >
            {code}
          </Text>
        );
      } else if (match.type === "italic") {
        const { text: italicText } = match.data;
        elements.push(
          <Text key={`${keyPrefix}-italic-${elementIndex}`} className="italic">
            {italicText}
          </Text>
        );
      }

      lastIndex = match.index + match.length;
      elementIndex++;
    });

    // 残りのテキストを追加
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      if (remaining) {
        elements.push(remaining);
      }
    }

    return elements.length > 0 ? elements : [text];
  };

  /**
   * MarkdownテキストをパースしてReact要素の配列に変換
   * サポートする構文:
   * - 見出し (# ## ###)
   * - 太字 (**text** または __text__)
   * - イタリック (*text* または _text_)
   * - リスト (- または *)
   * - 番号付きリスト (1. 2. など)
   * - チェックボックスリスト (- [ ] または - [x])
   * - コードブロック (```...```)
   * - インラインコード (`code`)
   * - リンク ([text](url))
   * - 画像 (![alt](url))
   * - 引用 (>)
   * - 水平線 (---)
   * - テーブル
   * @param text - パースするMarkdownテキスト
   * @returns React要素の配列
   */
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 水平線（--- または *** または ___）
      if (/^[-*_]{3,}$/.test(trimmedLine)) {
        elements.push(
          <View
            key={`hr-${i}`}
            className="h-px bg-border my-4"
            style={{ backgroundColor: colors.border }}
            testID={`hr-${i}`}
          />
        );
        i++;
        continue;
      }

      // 引用（>）
      if (trimmedLine.startsWith("> ")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("> ")) {
          quoteLines.push(lines[i].trim().substring(2));
          i++;
        }
        i--; // ループの最後でi++されるので、1つ戻す
        elements.push(
          <View
            key={`quote-${i}`}
            className="border-l-4 pl-4 py-2 mb-3"
            style={{ borderLeftColor: colors.primary }}
            testID={`quote-${i}`}
          >
            <Text className="text-base text-foreground leading-relaxed italic">
              {parseInlineElements(quoteLines.join("\n"), `quote-${i}`)}
            </Text>
          </View>
        );
        i++;
        continue;
      }

      // テーブル（| で区切られた行）
      if (trimmedLine.includes("|") && trimmedLine.split("|").length >= 3) {
        const tableRows: string[][] = [];
        const headerRow = trimmedLine.split("|").map((cell) => cell.trim()).filter((cell) => cell);
        i++; // ヘッダーの次の行（区切り行）をスキップ
        if (i < lines.length && /^[\s|:-]+$/.test(lines[i].trim())) {
          i++;
        }
        // テーブルの行を収集
        while (i < lines.length && lines[i].trim().includes("|")) {
          const row = lines[i]
            .split("|")
            .map((cell) => cell.trim())
            .filter((cell) => cell);
          if (row.length > 0) {
            tableRows.push(row);
          }
          i++;
        }
        i--; // ループの最後でi++されるので、1つ戻す

        elements.push(
          <View
            key={`table-${i}`}
            className="border border-border rounded-lg mb-3 overflow-hidden"
            testID={`table-${i}`}
          >
            {/* ヘッダー */}
            <View className="flex-row bg-surface border-b border-border" testID={`table-header-${i}`}>
              {headerRow.map((cell, cellIdx) => (
                <View
                  key={`th-${i}-${cellIdx}`}
                  className="flex-1 px-2 py-2 border-r border-border last:border-r-0"
                  testID={`table-header-cell-${i}-${cellIdx}`}
                >
                  <Text className="text-sm font-bold text-foreground">{cell}</Text>
                </View>
              ))}
            </View>
            {/* データ行 */}
            {tableRows.map((row, rowIdx) => (
              <View
                key={`tr-${i}-${rowIdx}`}
                className="flex-row border-b border-border last:border-b-0"
                testID={`table-row-${i}-${rowIdx}`}
              >
                {row.map((cell, cellIdx) => (
                  <View
                    key={`td-${i}-${rowIdx}-${cellIdx}`}
                    className="flex-1 px-2 py-2 border-r border-border last:border-r-0"
                    testID={`table-cell-${i}-${rowIdx}-${cellIdx}`}
                  >
                    <Text className="text-sm text-foreground">
                      {parseInlineElements(cell, `table-${i}-${rowIdx}-${cellIdx}`)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
        i++;
        continue;
      }

      // 見出し（# ## ### など）
      if (line.startsWith("### ")) {
        const headingText = line.substring(4);
        elements.push(
          <Text key={`h3-${i}`} className="text-lg font-bold text-foreground mt-3 mb-2">
            {parseInlineElements(headingText, `h3-${i}`)}
          </Text>
        );
      } else if (line.startsWith("## ")) {
        const headingText = line.substring(3);
        elements.push(
          <Text key={`h2-${i}`} className="text-xl font-bold text-foreground mt-4 mb-2">
            {parseInlineElements(headingText, `h2-${i}`)}
          </Text>
        );
      } else if (line.startsWith("# ")) {
        const headingText = line.substring(2);
        elements.push(
          <Text key={`h1-${i}`} className="text-2xl font-bold text-foreground mt-4 mb-3">
            {parseInlineElements(headingText, `h1-${i}`)}
          </Text>
        );
      }
      // チェックボックスリスト（- [ ] または - [x]）
      else if (/^-\s+\[([ x])\]/.test(trimmedLine)) {
        const checkboxMatch = trimmedLine.match(/^-\s+\[([ x])\]\s*(.*)/);
        if (checkboxMatch) {
          const isChecked = checkboxMatch[1] === "x";
          const text = checkboxMatch[2];
          elements.push(
            <View key={`checkbox-${i}`} className="flex-row items-start mb-1 pl-4" testID={`checkbox-${i}`}>
              <Text className="text-foreground mr-2">{isChecked ? "☑" : "☐"}</Text>
              <Text className="text-base text-foreground flex-1 leading-relaxed">
                {parseInlineElements(text, `checkbox-${i}`)}
              </Text>
            </View>
          );
        }
      }
      // 番号付きリスト（1. 2. など）
      else if (/^\d+\.\s/.test(trimmedLine)) {
        const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
        if (numberMatch) {
          const number = numberMatch[1];
          const text = numberMatch[2];
          elements.push(
            <View key={`ordered-list-${i}`} className="flex-row items-start mb-1 pl-4" testID={`ordered-list-${i}`}>
              <Text className="text-foreground mr-2">{number}.</Text>
              <Text className="text-base text-foreground flex-1 leading-relaxed">
                {parseInlineElements(text, `ordered-list-${i}`)}
              </Text>
            </View>
          );
        }
      }
      // リスト（- または *）
      else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        const text = trimmedLine.substring(2);
        elements.push(
          <View key={`list-${i}`} className="flex-row items-start mb-1 pl-4" testID={`list-${i}`}>
            <Text className="text-foreground mr-2">•</Text>
            <Text className="text-base text-foreground flex-1 leading-relaxed">
              {parseInlineElements(text, `list-${i}`)}
            </Text>
          </View>
        );
      }
      // コードブロック（```...```）
      else if (line.startsWith("```")) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <View
            key={`code-${i}`}
            className="bg-surface rounded-lg p-3 mb-3 border border-border"
          >
            <Text className="text-sm text-muted font-mono leading-relaxed">
              {codeLines.join("\n")}
            </Text>
          </View>
        );
      }
      // 空行
      else if (trimmedLine === "") {
        elements.push(<View key={`space-${i}`} className="h-2" />);
      }
      // 通常のテキスト（インライン要素を含む）
      else if (trimmedLine) {
        elements.push(
          <Text key={`text-${i}`} className="text-base text-foreground leading-relaxed mb-2" testID={`text-${i}`}>
            {parseInlineElements(line, `text-${i}`)}
          </Text>
        );
      }

      i++;
    }

    return elements;
  };

  return (
    <ScrollView className={cn("flex-1 bg-background", className)} testID="markdown-preview-scroll">
      <View className="p-4" testID="markdown-preview-content">{parseMarkdown(content)}</View>
    </ScrollView>
  );
}
