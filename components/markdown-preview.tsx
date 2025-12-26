import React from "react";
import { ScrollView, Text, View } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * シンプルな Markdown プレビューコンポーネント
 * 基本的な Markdown 構文をレンダリング
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const colors = useColors();

  // シンプルな Markdown パーサー
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 見出し（# ## ### など）
      if (line.startsWith("### ")) {
        elements.push(
          <Text key={`h3-${i}`} className="text-lg font-bold text-foreground mt-3 mb-2">
            {line.substring(4)}
          </Text>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <Text key={`h2-${i}`} className="text-xl font-bold text-foreground mt-4 mb-2">
            {line.substring(3)}
          </Text>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <Text key={`h1-${i}`} className="text-2xl font-bold text-foreground mt-4 mb-3">
            {line.substring(2)}
          </Text>
        );
      }
      // 太字（**text** または __text__）
      else if (line.includes("**") || line.includes("__")) {
        const parts = line.split(/(\*\*.*?\*\*|__.*?__)/);
        elements.push(
          <Text key={`bold-${i}`} className="text-base text-foreground leading-relaxed mb-2">
            {parts.map((part, idx) => {
              if (part.startsWith("**") || part.startsWith("__")) {
                const text = part.substring(2, part.length - 2);
                return (
                  <Text key={idx} className="font-bold">
                    {text}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
      // イタリック（*text* または _text_）
      else if (line.includes("*") || line.includes("_")) {
        const parts = line.split(/(\*.*?\*|_.*?_)/);
        elements.push(
          <Text key={`italic-${i}`} className="text-base text-foreground leading-relaxed mb-2 italic">
            {parts.map((part, idx) => {
              if ((part.startsWith("*") || part.startsWith("_")) && part.length > 2) {
                const text = part.substring(1, part.length - 1);
                return (
                  <Text key={idx} className="italic">
                    {text}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
      // リスト（- または *）
      else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const text = line.trim().substring(2);
        elements.push(
          <View key={`list-${i}`} className="flex-row items-start mb-1 pl-4">
            <Text className="text-foreground mr-2">•</Text>
            <Text className="text-base text-foreground flex-1 leading-relaxed">{text}</Text>
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
      // インラインコード（`code`）
      else if (line.includes("`")) {
        const parts = line.split(/(`[^`]+`)/);
        elements.push(
          <Text key={`inline-code-${i}`} className="text-base text-foreground leading-relaxed mb-2">
            {parts.map((part, idx) => {
              if (part.startsWith("`") && part.endsWith("`")) {
                const code = part.substring(1, part.length - 1);
                return (
                  <Text
                    key={idx}
                    className="bg-surface px-1 py-0.5 rounded font-mono text-sm text-primary"
                  >
                    {code}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
      // 空行
      else if (line.trim() === "") {
        elements.push(<View key={`space-${i}`} className="h-2" />);
      }
      // 通常のテキスト
      else if (line.trim()) {
        elements.push(
          <Text key={`text-${i}`} className="text-base text-foreground leading-relaxed mb-2">
            {line}
          </Text>
        );
      }

      i++;
    }

    return elements;
  };

  return (
    <ScrollView className={cn("flex-1 bg-background", className)}>
      <View className="p-4">{parseMarkdown(content)}</View>
    </ScrollView>
  );
}
