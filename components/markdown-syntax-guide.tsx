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
import { useColors } from "@/hooks/use-colors";
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

const MARKDOWN_SYNTAX: SyntaxCategory[] = [
  {
    category: "見出し",
    items: [
      { title: "H1", syntax: "# 見出し1", description: "最大の見出し" },
      { title: "H2", syntax: "## 見出し2", description: "中程度の見出し" },
      { title: "H3", syntax: "### 見出し3", description: "小さい見出し" },
      { title: "H4", syntax: "#### 見出し4", description: "さらに小さい見出し" },
    ],
  },
  {
    category: "テキスト装飾",
    items: [
      { title: "太字", syntax: "**太字**", description: "テキストを太くします" },
      { title: "イタリック", syntax: "*イタリック*", description: "テキストを斜めにします" },
      { title: "打ち消し", syntax: "~~打ち消し~~", description: "テキストに線を引きます" },
      { title: "コード", syntax: "`code`", description: "インラインコード" },
    ],
  },
  {
    category: "リスト",
    items: [
      { title: "順序なしリスト", syntax: "- 項目\n- 項目", description: "箇条書きリスト" },
      { title: "順序付きリスト", syntax: "1. 項目\n2. 項目", description: "番号付きリスト" },
      { title: "ネストリスト", syntax: "- 項目\n  - 子項目", description: "階層化されたリスト" },
    ],
  },
  {
    category: "コードブロック",
    items: [
      {
        title: "コードブロック",
        syntax: "```\ncode here\n```",
        description: "複数行のコード",
      },
      {
        title: "言語指定",
        syntax: "```javascript\ncode here\n```",
        description: "シンタックスハイライト付き",
      },
    ],
  },
  {
    category: "その他",
    items: [
      { title: "リンク", syntax: "[テキスト](URL)", description: "ハイパーリンク" },
      { title: "画像", syntax: "![alt](URL)", description: "画像の埋め込み" },
      { title: "引用", syntax: "> 引用テキスト", description: "ブロック引用" },
      { title: "水平線", syntax: "---", description: "区切り線" },
    ],
  },
];

interface MarkdownSyntaxGuideProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

export function MarkdownSyntaxGuide({ visible, onClose, testID }: MarkdownSyntaxGuideProps) {
  const colors = useColors();

  const handleCopySyntax = (syntax: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Clipboard.setString(syntax);
      Alert.alert("コピーしました", `"${syntax}" をクリップボードにコピーしました`);
    } catch (error) {
      Alert.alert("エラー", "コピーに失敗しました");
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
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }} testID={`${testID}-title`}>
            Markdown構文ガイド
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }} testID={`${testID}-close-button`}>
            <Text style={{ fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* コンテンツ */}
        <ScrollView style={{ flex: 1, paddingVertical: 12 }} testID={`${testID}-scroll`}>
          {MARKDOWN_SYNTAX.map((categoryData, categoryIndex) => (
            <View key={categoryIndex} style={{ marginBottom: 20, paddingHorizontal: 16 }}>
              {/* カテゴリタイトル */}
              <Text
                style={{
                  fontSize: 18,
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
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.foreground,
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
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
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {item.description}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
                    💡 タップしてコピー
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
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                💡 各構文をタップするとクリップボードにコピーされます。エディタに貼り付けて使用してください。
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
