/**
 * Markdown構文ガイドコンポーネント
 * Markdownの構文を説明し、タップでコピーできる機能を提供
 */

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Clipboard,
} from "react-native";
import { useColors, useFontSize } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/language-provider";
import * as Haptics from "expo-haptics";

interface SyntaxItem {
  title: string;
  syntax: string;
  description: string;
}

interface SyntaxCategory {
  category: string;
  items: SyntaxItem[];
}

// 構文データは動的に生成（言語に応じて）
function getMarkdownSyntax(t: (key: string) => string, language: "ja" | "en"): SyntaxCategory[] {
  const headingText = language === "ja" ? "見出し" : "Heading";
  const boldText = language === "ja" ? "太字" : "Bold";
  const italicText = language === "ja" ? "イタリック" : "Italic";
  const strikethroughText = language === "ja" ? "打ち消し" : "Strikethrough";
  const itemText = language === "ja" ? "項目" : "Item";
  const subItemText = language === "ja" ? "子項目" : "Sub Item";
  const quoteText = language === "ja" ? "引用テキスト" : "Quote text";
  
  return [
    {
      category: t("syntaxGuide.categories.headings"),
      items: [
        { title: t("syntaxGuide.items.h1"), syntax: `# ${headingText}1`, description: t("syntaxGuide.items.h1Description") },
        { title: t("syntaxGuide.items.h2"), syntax: `## ${headingText}2`, description: t("syntaxGuide.items.h2Description") },
        { title: t("syntaxGuide.items.h3"), syntax: `### ${headingText}3`, description: t("syntaxGuide.items.h3Description") },
        { title: t("syntaxGuide.items.h4"), syntax: `#### ${headingText}4`, description: t("syntaxGuide.items.h4Description") },
      ],
    },
    {
      category: t("syntaxGuide.categories.textDecoration"),
      items: [
        { title: t("syntaxGuide.items.bold"), syntax: `**${boldText}**`, description: t("syntaxGuide.items.boldDescription") },
        { title: t("syntaxGuide.items.italic"), syntax: `*${italicText}*`, description: t("syntaxGuide.items.italicDescription") },
        { title: t("syntaxGuide.items.strikethrough"), syntax: `~~${strikethroughText}~~`, description: t("syntaxGuide.items.strikethroughDescription") },
        { title: t("syntaxGuide.items.code"), syntax: "`code`", description: t("syntaxGuide.items.codeDescription") },
      ],
    },
    {
      category: t("syntaxGuide.categories.lists"),
      items: [
        { title: t("syntaxGuide.items.unorderedList"), syntax: `- ${itemText}\n- ${itemText}`, description: t("syntaxGuide.items.unorderedListDescription") },
        { title: t("syntaxGuide.items.orderedList"), syntax: `1. ${itemText}\n2. ${itemText}`, description: t("syntaxGuide.items.orderedListDescription") },
        { title: t("syntaxGuide.items.nestedList"), syntax: `- ${itemText}\n  - ${subItemText}`, description: t("syntaxGuide.items.nestedListDescription") },
        { title: t("syntaxGuide.items.checkboxList"), syntax: `- [ ] ${itemText}\n- [x] ${itemText}`, description: t("syntaxGuide.items.checkboxListDescription") },
      ],
    },
    {
      category: t("syntaxGuide.categories.codeBlocks"),
      items: [
        {
          title: t("syntaxGuide.items.codeBlock"),
          syntax: "```\ncode here\n```",
          description: t("syntaxGuide.items.codeBlockDescription"),
        },
        {
          title: t("syntaxGuide.items.languageSpecified"),
          syntax: "```javascript\ncode here\n```",
          description: t("syntaxGuide.items.languageSpecifiedDescription"),
        },
      ],
    },
    {
      category: t("syntaxGuide.categories.other"),
      items: [
        { title: t("syntaxGuide.items.link"), syntax: "[text](URL)", description: t("syntaxGuide.items.linkDescription") },
        { title: t("syntaxGuide.items.image"), syntax: "![alt](URL)", description: t("syntaxGuide.items.imageDescription") },
        { title: t("syntaxGuide.items.quote"), syntax: `> ${quoteText}`, description: t("syntaxGuide.items.quoteDescription") },
        { title: t("syntaxGuide.items.horizontalRule"), syntax: "---", description: t("syntaxGuide.items.horizontalRuleDescription") },
        { title: t("syntaxGuide.items.table"), syntax: "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |", description: t("syntaxGuide.items.tableDescription") },
      ],
    },
  ];
}

interface MarkdownSyntaxGuideProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

export function MarkdownSyntaxGuide({ visible, onClose, testID }: MarkdownSyntaxGuideProps) {
  const colors = useColors();
  const fontSize = useFontSize();
  const { t, language } = useLanguage();
  const MARKDOWN_SYNTAX = getMarkdownSyntax(t, language);

  const handleCopySyntax = (syntax: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Clipboard.setString(syntax);
      Alert.alert(t("syntaxGuide.copySuccess"), t("syntaxGuide.copySuccessMessage", { syntax }));
    } catch (error) {
      Alert.alert(t("syntaxGuide.copyError"), t("syntaxGuide.copyErrorMessage"));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={{ backgroundColor: colors.background, flex: 1 }} testID={`${testID}-container`}>
        {/* ヘッダー */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          testID={`${testID}-header`}
        >
          <Text style={{ fontSize: fontSize * 1.25, fontWeight: "bold", color: colors.foreground }} testID={`${testID}-title`}>
            {t("syntaxGuide.title")}
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }} testID={`${testID}-close-button`}>
            <Text style={{ fontSize: fontSize * 1.5, color: colors.foreground }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* コンテンツ */}
        <ScrollView style={{ flex: 1, paddingVertical: 12 }} testID={`${testID}-scroll`}>
          {MARKDOWN_SYNTAX.map((categoryData, categoryIndex) => (
            <View key={categoryIndex} style={{ marginBottom: 20, paddingHorizontal: 16 }}>
              {/* カテゴリタイトル */}
              <Text
                style={{
                  fontSize: fontSize * 1.125,
                  fontWeight: "bold",
                  color: colors.primary,
                  marginBottom: 12,
                }}
              >
                {categoryData.category}
              </Text>

              {/* 構文アイテム */}
              {categoryData.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  onPress={() => handleCopySyntax(item.syntax)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={{ marginBottom: 8 }}>
                    <Text
                      style={{
                        fontSize: fontSize * 0.875,
                        fontWeight: "600",
                        color: colors.foreground,
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: fontSize * 0.8125,
                        fontFamily: "monospace",
                        backgroundColor: colors.background,
                        color: colors.primary,
                        padding: 8,
                        borderRadius: 4,
                      }}
                    >
                      {item.syntax}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSize * 0.75, color: colors.muted }}>
                    {item.description}
                  </Text>
                  <Text style={{ fontSize: fontSize * 0.6875, color: colors.muted, marginTop: 6 }}>
                    {t("syntaxGuide.tapToCopy")}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}

          {/* フッター */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text style={{ fontSize: fontSize * 0.75, color: colors.muted, lineHeight: 18 }}>
                {t("syntaxGuide.footerMessage")}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
