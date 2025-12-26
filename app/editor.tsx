import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { MarkdownPreview } from "@/components/markdown-preview";
import { useMarkdownFiles, type MarkdownFile } from "@/hooks/use-markdown-files";
import { useMarkdownDownload } from "@/hooks/use-markdown-download";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

type TabType = "editor" | "preview";

export default function EditorScreen() {
  const router = useRouter();
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const colors = useColors();
  const { getFile, updateFileContent, loading: filesLoading } = useMarkdownFiles();
  const { downloadAsMarkdown, downloadAsHTML, downloadAsText, downloading } =
    useMarkdownDownload();

  const [file, setFile] = useState<MarkdownFile | null>(null);
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // ファイルを読み込む
  useEffect(() => {
    if (fileId) {
      const loadedFile = getFile(fileId);
      if (loadedFile) {
        setFile(loadedFile);
        setContent(loadedFile.content);
        setSaveStatus("saved");
      }
    }
  }, [fileId, getFile]);

  // コンテンツが変更されたときの自動保存
  useEffect(() => {
    if (!file) return;

    setSaveStatus("unsaved");

    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        setSaveStatus("saving");
        await updateFileContent(file.id, content);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Failed to save:", error);
        setSaveStatus("unsaved");
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1秒後に自動保存

    return () => clearTimeout(timer);
  }, [content, file, updateFileContent]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleDownload = async (format: "markdown" | "html" | "text", method: "share" | "local") => {
    if (!file) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowDownloadMenu(false);

      const fileName = file.name.replace(/\.md$/, "");

      if (format === "markdown") {
        await downloadAsMarkdown(fileName, content, method);
      } else if (format === "html") {
        await downloadAsHTML(fileName, content, file.name, method);
      } else if (format === "text") {
        await downloadAsText(fileName, content, method);
      }

      const methodLabel = method === "share" ? "共有" : "ローカル保存";
      const formatLabel = format === "markdown" ? "Markdown" : format === "html" ? "HTML" : "テキスト";
      Alert.alert("成功", `${formatLabel}形式で${methodLabel}しました`);
    } catch (error) {
      Alert.alert("エラー", "ダウンロードに失敗しました");
      console.error("Download failed:", error);
    }
  };

  if (filesLoading || !file) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case "saved":
        return colors.success;
      case "saving":
        return colors.warning;
      case "unsaved":
        return colors.error;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saved":
        return "保存済み";
      case "saving":
        return "保存中...";
      case "unsaved":
        return "未保存";
    }
  };

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* ヘッダー */}
        <View className="px-4 py-3 border-b border-border flex-row items-center justify-between">
          <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
            <Text className="text-lg text-primary font-semibold">← 戻る</Text>
          </TouchableOpacity>
          <View className="flex-1 mx-2">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {file.name}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className="text-xs font-medium"
              style={{ color: getSaveStatusColor() }}
            >
              {getSaveStatusText()}
            </Text>
          </View>
        </View>

        {/* タブ */}
        <View className="flex-row border-b border-border bg-surface">
          <Pressable
            onPress={() => handleTabChange("editor")}
            style={({ pressed }) => [
              styles.tab,
              {
                borderBottomWidth: activeTab === "editor" ? 3 : 0,
                borderBottomColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              className={`text-base font-semibold ${
                activeTab === "editor" ? "text-primary" : "text-muted"
              }`}
            >
              エディタ
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange("preview")}
            style={({ pressed }) => [
              styles.tab,
              {
                borderBottomWidth: activeTab === "preview" ? 3 : 0,
                borderBottomColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              className={`text-base font-semibold ${
                activeTab === "preview" ? "text-primary" : "text-muted"
              }`}
            >
              プレビュー
            </Text>
          </Pressable>
        </View>

        {/* コンテンツ */}
        <View className="flex-1">
          {activeTab === "editor" ? (
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Markdownを入力してください..."
              placeholderTextColor={colors.muted}
              multiline
              scrollEnabled
              className="flex-1 px-4 py-3 text-base text-foreground bg-background"
              style={{
                fontFamily: "monospace",
                textAlignVertical: "top",
              }}
            />
          ) : (
            <MarkdownPreview content={content} className="flex-1" />
          )}
        </View>

        {/* ボトムアクションバー */}
        <View className="px-4 py-3 border-t border-border flex-row gap-2">
          <TouchableOpacity
            onPress={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={downloading}
            className="flex-1 bg-primary rounded-lg py-3 items-center justify-center"
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-base font-semibold text-background">⬇ ダウンロード</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ダウンロードメニュー */}
        {showDownloadMenu && (
          <View className="px-4 pb-3 gap-2 bg-surface border-t border-border max-h-96">
            <ScrollView>
              {/* Markdown形式 */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-foreground mb-2">Markdown形式</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("markdown", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">💾 ローカル保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("markdown", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">📤 共有</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* HTML形式 */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-foreground mb-2">HTML形式</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("html", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">💾 ローカル保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("html", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">📤 共有</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* テキスト形式 */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">テキスト形式</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("text", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">💾 ローカル保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("text", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">📤 共有</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
