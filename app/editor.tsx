/**
 * Markdownエディタ画面コンポーネント
 * エディタとプレビューの切り替え、自動保存、ダウンロード機能を提供
 */

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
import { MarkdownSyntaxGuide } from "@/components/markdown-syntax-guide";
import { useMarkdownFiles, type MarkdownFile } from "@/hooks/use-markdown-files";
import { useMarkdownDownload } from "@/hooks/use-markdown-download";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/language-provider";
import * as Haptics from "expo-haptics";

// タブタイプ（エディタまたはプレビュー）
type TabType = "editor" | "preview";

/**
 * エディタ画面
 * - Markdownの編集機能
 * - リアルタイムプレビュー
 * - 自動保存（1秒後に保存）
 * - 複数形式でのダウンロード（Markdown、HTML、テキスト）
 * - マークダウン構文ガイド
 */
export default function EditorScreen() {
  // ナビゲーションとパラメータ
  const router = useRouter();
  const { fileId } = useLocalSearchParams<{ fileId: string }>(); // URLパラメータからファイルIDを取得
  const colors = useColors();
  const { t } = useLanguage();
  
  // カスタムフック
  const { getFile, updateFileContent, loading: filesLoading } = useMarkdownFiles();
  const { downloadAsMarkdown, downloadAsHTML, downloadAsText, downloading } =
    useMarkdownDownload();

  // 状態管理
  const [file, setFile] = useState<MarkdownFile | null>(null); // 現在編集中のファイル
  const [content, setContent] = useState(""); // エディタのコンテンツ
  const [activeTab, setActiveTab] = useState<TabType>("editor"); // アクティブなタブ（エディタ/プレビュー）
  const [isSaving, setIsSaving] = useState(false); // 保存中のフラグ
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved"); // 保存状態
  const [showDownloadMenu, setShowDownloadMenu] = useState(false); // ダウンロードメニューの表示状態
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false); // 構文ガイドの表示状態

  /**
   * ファイルIDが変更されたときにファイルを読み込む
   */
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

  /**
   * コンテンツが変更されたときに自動保存を実行
   * 1秒のディレイ後に保存を実行（デバウンス処理）
   */
  useEffect(() => {
    if (!file) return;

    // 変更を検知したら未保存状態に設定
    setSaveStatus("unsaved");

    // 1秒後に自動保存
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

    // クリーンアップ: タイマーをクリア
    return () => clearTimeout(timer);
  }, [content, file, updateFileContent]);

  /**
   * 前の画面に戻る
   */
  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  /**
   * タブを切り替え（エディタ/プレビュー）
   * @param tab - 切り替えるタブ
   */
  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  /**
   * ファイルをダウンロード
   * @param format - ダウンロード形式（markdown/html/text）
   * @param method - ダウンロード方法（share/local）
   */
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

      const methodLabel = method === "share" ? t("editor.share") : t("editor.localSave");
      const formatLabel = format === "markdown" ? t("editor.downloadMarkdown") : format === "html" ? t("editor.downloadHTML") : t("editor.downloadText");
      Alert.alert(t("common.success"), t("editor.downloadSuccess", { format: formatLabel, method: methodLabel }));
    } catch (error) {
      Alert.alert(t("common.error"), t("editor.downloadError"));
      console.error("Download failed:", error);
    }
  };

  // ローディング中またはファイルが存在しない場合はローディング表示
  if (filesLoading || !file) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  /**
   * 保存状態に応じた色を取得
   * @returns 保存状態の色
   */
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

  /**
   * 保存状態に応じたテキストを取得
   * @returns 保存状態のテキスト
   */
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saved":
        return t("common.saved");
      case "saving":
        return t("common.saving");
      case "unsaved":
        return t("common.unsaved");
    }
  };

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* ヘッダー */}
        <View className="px-4 py-3 border-b border-border flex-row items-center justify-between">
          <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
            <Text className="text-lg text-primary font-semibold">← {t("common.back")}</Text>
          </TouchableOpacity>
          <View className="flex-1 mx-2">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {file.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowSyntaxGuide(true)}
            className="px-3 py-2 rounded-lg bg-primary flex-row items-center gap-1"
          >
            <Text className="text-sm">📚</Text>
            <Text className="text-xs font-semibold text-background">{t("editor.syntax")}</Text>
          </TouchableOpacity>
          <View className="items-end ml-2">
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
              {t("editor.title")}
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
              {t("editor.preview")}
            </Text>
          </Pressable>
        </View>

        {/* コンテンツ */}
        <View className="flex-1">
          {activeTab === "editor" ? (
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={t("editor.placeholder")}
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
              <Text className="text-base font-semibold text-background">{t("editor.download")}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 構文ガイドモーダル */}
        <MarkdownSyntaxGuide
          visible={showSyntaxGuide}
          onClose={() => setShowSyntaxGuide(false)}
        />

        {/* ダウンロードメニュー */}
        {showDownloadMenu && (
          <View className="px-4 pb-3 gap-2 bg-surface border-t border-border max-h-96">
            <ScrollView>
              {/* Markdown形式 */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-foreground mb-2">{t("editor.downloadMarkdown")}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("markdown", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.localSave")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("markdown", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.share")}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* HTML形式 */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-foreground mb-2">{t("editor.downloadHTML")}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("html", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.localSave")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("html", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.share")}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* テキスト形式 */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">{t("editor.downloadText")}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("text", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.localSave")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("text", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.share")}</Text>
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
