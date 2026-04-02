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
  Modal,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { MarkdownPreview } from "@/components/markdown-preview";
import { MarkdownSyntaxGuide } from "@/components/markdown-syntax-guide";
import { useMarkdownFilesUniversal } from "@/hooks/use-markdown-files-universal";
import type { MarkdownFile } from "@/hooks/use-markdown-files";
import { useMarkdownDownloadUniversal } from "@/hooks/use-markdown-download-universal";
import { useColors, useFontSize } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/lib/language-provider";
import { normalizeFilePath } from "@/lib/markdown-file-path";
import { pickImageUriForMarkdown } from "@/lib/editor-image-pick";
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
  const fontSize = useFontSize();
  const colorScheme = useColorScheme();
  const { t } = useLanguage();
  
  // カスタムフック
  const { getFile, updateFileContent, renameFile, loading: filesLoading } = useMarkdownFilesUniversal();
  const { downloadAsMarkdown, downloadAsHTML, downloadAsText, downloading } =
    useMarkdownDownloadUniversal();

  // 状態管理
  const [file, setFile] = useState<MarkdownFile | null>(null); // 現在編集中のファイル
  const [content, setContent] = useState(""); // エディタのコンテンツ
  const [activeTab, setActiveTab] = useState<TabType>("editor"); // アクティブなタブ（エディタ/プレビュー）
  const [isSaving, setIsSaving] = useState(false); // 保存中のフラグ
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved"); // 保存状態
  const [showDownloadMenu, setShowDownloadMenu] = useState(false); // ダウンロードメニューの表示状態
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false); // 構文ガイドの表示状態
  const [showRenameModal, setShowRenameModal] = useState(false); // 名前変更モーダルの表示状態
  const [newFileName, setNewFileName] = useState(""); // 新しいファイル名
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageAlt, setImageAlt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLearnLine, setImageLearnLine] = useState("");
  const selectionRef = useRef({ start: 0, end: 0 });

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
   * ちらつきを防ぐため、初期読み込み時は保存処理をスキップ
   */
  useEffect(() => {
    if (!file) return;
    
    // ファイル読み込み直後の変更は無視（ちらつき防止）
    if (content === file.content) {
      setSaveStatus("saved");
      return;
    }

    // 未保存の変更があることを表示
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
      const aborted =
        error !== null &&
        typeof error === "object" &&
        (error as { name?: string }).name === "AbortError";
      if (aborted) {
        return;
      }
      Alert.alert(t("common.error"), t("editor.downloadError"));
      console.error("Download failed:", error);
    }
  };

  /**
   * ファイル名変更モーダルを開く
   */
  const handleRenameStart = () => {
    if (!file) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewFileName(file.name);
    setShowRenameModal(true);
  };

  /**
   * ファイル名を変更（モーダルで確認後）
   */
  const handleRenameConfirm = async () => {
    if (!file || !newFileName.trim()) {
      Alert.alert(t("common.error"), t("editor.renameError"));
      return;
    }

    try {
      const renamedFile = await renameFile(file.id, normalizeFilePath(newFileName.trim()));
      if (renamedFile) {
        setFile(renamedFile);
        setShowRenameModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("editor.renameError"));
      console.error("Rename failed:", error);
    }
  };

  const insertIntoEditor = (snippet: string) => {
    const { start, end } = selectionRef.current;
    setContent((prev) => {
      const safeStart = Math.min(Math.max(0, start), prev.length);
      const safeEnd = Math.min(Math.max(Math.max(safeStart, end), 0), prev.length);
      const next = safeStart + snippet.length;
      selectionRef.current = { start: next, end: next };
      return prev.slice(0, safeStart) + snippet + prev.slice(safeEnd);
    });
  };

  const openImageModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUrl("");
    setImageLearnLine("");
    setShowImageModal(true);
  };

  const handleInsertImageFromUrl = () => {
    if (!file) return;
    const url = imageUrl.trim();
    if (!url) {
      Alert.alert(t("common.error"), t("editor.imageUrlLabel"));
      return;
    }
    const alt = imageAlt.trim() || t("editor.imageAltDefault");
    const line = `![${alt.replace(/]/g, "")}](${url})`;
    insertIntoEditor(`${line}\n`);
    setImageLearnLine(line);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleInsertImageFromDevice = async () => {
    if (!file) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await pickImageUriForMarkdown(file.id);
      if (!uri) {
        Alert.alert(t("common.error"), t("editor.imagePermissionDenied"));
        return;
      }
      const alt = imageAlt.trim() || t("editor.imageAltDefault");
      const line = `![${alt.replace(/]/g, "")}](${uri})`;
      insertIntoEditor(`${line}\n`);
      setImageLearnLine(line);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("editor.imageInsertError"));
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
    if (isSaving || saveStatus === "saving") {
      return colors.muted;
    }
    if (saveStatus === "unsaved") {
      return colors.warning;
    }
    return colors.success;
  };

  /**
   * 保存状態に応じたテキストを取得
   * @returns 保存状態のテキスト
   */
  const getSaveStatusText = () => {
    if (isSaving || saveStatus === "saving") {
      return t("common.saving");
    }
    if (saveStatus === "unsaved") {
      return t("common.unsaved");
    }
    return t("common.saved");
  };

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right", "bottom"]} testID="editor-screen">
      <View className="flex-1" testID="editor-container">
        {/* ヘッダー */}
        <View className="px-4 py-3 border-b border-border flex-row items-center justify-between" testID="editor-header">
          <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2" testID="editor-back-button">
            <Text className="text-lg text-primary font-semibold">← {t("common.back")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRenameStart}
            onLongPress={handleRenameStart}
            className="flex-1 mx-2"
            testID="editor-file-name-container"
          >
            <Text className="text-base font-semibold text-foreground" numberOfLines={1} testID="editor-file-name">
              {file.name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSyntaxGuide(true)}
            className="px-3 py-2 rounded-lg bg-primary flex-row items-center gap-1"
            testID="editor-syntax-button"
          >
            <Text className="text-sm">📚</Text>
            <Text className="text-xs font-semibold text-background">{t("editor.syntax")}</Text>
          </TouchableOpacity>
          <View className="items-end ml-2" testID="editor-save-status-container">
            <Text
              className="text-xs font-medium"
              style={{ color: getSaveStatusColor() }}
              testID="editor-save-status"
            >
              {getSaveStatusText()}
            </Text>
          </View>
        </View>

        {/* タブ */}
        <View className="flex-row border-b border-border bg-surface" testID="editor-tabs">
          <Pressable
            onPress={() => handleTabChange("editor")}
            testID="editor-tab-editor"
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
            testID="editor-tab-preview"
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
        <View className="flex-1" testID="editor-content">
          {activeTab === "editor" ? (
            <TextInput
              value={content}
              onChangeText={setContent}
              onSelectionChange={(e) => {
                selectionRef.current = e.nativeEvent.selection;
              }}
              placeholder={t("editor.placeholder")}
              placeholderTextColor={colors.muted}
              multiline
              scrollEnabled
              className="flex-1 px-4 py-3 text-foreground bg-background"
              style={{
                fontFamily: "monospace",
                textAlignVertical: "top",
                fontSize: fontSize,
              }}
              testID="editor-text-input"
            />
          ) : (
            <MarkdownPreview content={content} className="flex-1" testID="editor-preview" />
          )}
        </View>

        {/* ボトムアクションバー */}
        <View className="px-4 py-3 border-t border-border flex-row gap-2" testID="editor-bottom-actions">
          <TouchableOpacity
            onPress={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={downloading}
            className="flex-1 bg-primary rounded-lg py-3 items-center justify-center"
            activeOpacity={0.8}
            testID="editor-download-button"
          >
            {downloading ? (
              <ActivityIndicator color={colors.background} testID="editor-download-loading" />
            ) : (
              <Text className="text-base font-semibold text-background">{t("editor.download")}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openImageModal}
            className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center"
            activeOpacity={0.8}
            testID="editor-image-button"
          >
            <Text className="text-base font-semibold text-foreground">{t("editor.insertImage")}</Text>
          </TouchableOpacity>
        </View>

        {/* 構文ガイドモーダル */}
        <MarkdownSyntaxGuide
          visible={showSyntaxGuide}
          onClose={() => setShowSyntaxGuide(false)}
          testID="editor-syntax-guide"
        />

        <Modal
          visible={showImageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
          testID="editor-image-modal"
        >
          <View
            className="flex-1 items-center justify-center px-3"
            style={{ backgroundColor: colorScheme === "dark" ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.45)" }}
          >
            <View className="w-full max-w-md rounded-xl p-5 gap-3" style={{ backgroundColor: colors.surface, maxHeight: "90%" }}>
              <Text className="text-lg font-bold text-foreground">{t("editor.imageModalTitle")}</Text>

              <ScrollView keyboardShouldPersistTaps="handled" className="max-h-96">
                <Text className="text-sm text-muted mb-1">{t("editor.imageAltLabel")}</Text>
                <TextInput
                  value={imageAlt}
                  onChangeText={setImageAlt}
                  placeholder={t("editor.imageAltDefault")}
                  placeholderTextColor={colors.muted}
                  className="px-3 py-2 rounded-lg text-base text-foreground border border-border mb-3"
                  style={{ borderColor: colors.border, borderWidth: 1 }}
                />

                <Text className="text-sm text-muted mb-1">{t("editor.imageUrlLabel")}</Text>
                <TextInput
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="px-3 py-2 rounded-lg text-base text-foreground border border-border mb-3"
                  style={{ borderColor: colors.border, borderWidth: 1 }}
                />

                <TouchableOpacity
                  onPress={handleInsertImageFromUrl}
                  className="bg-primary py-3 rounded-lg items-center mb-2"
                  testID="editor-image-insert-url"
                >
                  <Text className="font-semibold text-background">{t("editor.imageInsertButton")} (URL)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleInsertImageFromDevice}
                  className="bg-background border border-border py-3 rounded-lg items-center mb-3"
                  testID="editor-image-pick-device"
                >
                  <Text className="font-semibold text-foreground">{t("editor.imagePickDevice")}</Text>
                </TouchableOpacity>

                {Platform.OS !== "web" ? (
                  <Text className="text-xs text-muted leading-5 mb-2">{t("editor.imageSyncNoteFile")}</Text>
                ) : null}

                {imageLearnLine ? (
                  <View className="mt-1 gap-1">
                    <Text className="text-xs font-semibold text-foreground">{t("editor.imageMarkdownLearnTitle")}</Text>
                    <Text selectable className="text-xs text-muted font-mono leading-5" testID="editor-image-learn-line">
                      {imageLearnLine.length > 200 ? `${imageLearnLine.slice(0, 200)}…` : imageLearnLine}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                className="py-3 rounded-lg border border-border items-center"
              >
                <Text className="font-semibold text-foreground">{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ファイル名変更モーダル */}
        <Modal
          visible={showRenameModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRenameModal(false)}
          testID="editor-rename-modal"
        >
          <View
            className="flex-1 items-center justify-center px-4"
            style={{ backgroundColor: colorScheme === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)" }}
            testID="editor-rename-modal-backdrop"
          >
            <View
              className="w-full max-w-sm rounded-lg p-6 gap-4"
              style={{ backgroundColor: colors.surface }}
              testID="editor-rename-modal-content"
            >
              <Text className="text-lg font-bold text-foreground" testID="editor-rename-modal-title">{t("editor.renameTitle")}</Text>

              <TextInput
                value={newFileName}
                onChangeText={setNewFileName}
                placeholder={t("editor.renamePlaceholder")}
                placeholderTextColor={colors.muted}
                className="px-4 py-2 rounded-lg text-base text-foreground border border-border"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                testID="editor-rename-modal-input"
              />

              <View className="flex-row gap-3" testID="editor-rename-modal-actions">
                <TouchableOpacity
                  onPress={() => setShowRenameModal(false)}
                  className="flex-1 py-3 rounded-lg border border-border items-center"
                  testID="editor-rename-modal-cancel"
                >
                  <Text className="font-semibold text-foreground">{t("common.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRenameConfirm}
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: colors.primary }}
                  testID="editor-rename-modal-confirm"
                >
                  <Text className="font-semibold text-background">{t("common.confirm")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ダウンロードメニュー */}
        {showDownloadMenu && (
          <View className="px-4 pb-3 gap-2 bg-surface border-t border-border max-h-96" testID="editor-download-menu">
            <ScrollView testID="editor-download-menu-scroll">
              {/* Markdown形式 */}
              <View className="mb-3" testID="editor-download-markdown-section">
                <Text className="text-sm font-semibold text-foreground mb-2" testID="editor-download-markdown-title">{t("editor.downloadMarkdown")}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("markdown", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                    testID="editor-download-markdown-local"
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.localSave")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("markdown", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                    testID="editor-download-markdown-share"
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.share")}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* HTML形式 */}
              <View className="mb-3" testID="editor-download-html-section">
                <Text className="text-sm font-semibold text-foreground mb-2" testID="editor-download-html-title">{t("editor.downloadHTML")}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("html", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                    testID="editor-download-html-local"
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.localSave")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("html", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                    testID="editor-download-html-share"
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.share")}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* テキスト形式 */}
              <View testID="editor-download-text-section">
                <Text className="text-sm font-semibold text-foreground mb-2" testID="editor-download-text-title">{t("editor.downloadText")}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleDownload("text", "local")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                    testID="editor-download-text-local"
                  >
                    <Text className="text-xs font-semibold text-foreground text-center">{t("editor.localSave")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload("text", "share")}
                    disabled={downloading}
                    className="flex-1 bg-background border border-border rounded-lg py-2 px-3"
                    activeOpacity={0.7}
                    testID="editor-download-text-share"
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
