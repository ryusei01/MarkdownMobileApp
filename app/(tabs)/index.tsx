/**
 * ホーム画面コンポーネント
 * Markdownファイルの一覧表示、作成、削除、名前変更機能を提供
 */

import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useMarkdownFiles } from "@/hooks/use-markdown-files";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/language-provider";
import * as Haptics from "expo-haptics";

/**
 * ホーム画面
 * - ファイル一覧の表示
 * - ファイルの検索機能
 * - ファイルの作成、削除、名前変更
 * - エディタ画面への遷移
 */
export default function HomeScreen() {
  // ナビゲーションとスタイル
  const router = useRouter();
  const colors = useColors();
  const { t, language } = useLanguage();
  const { files, createFile, deleteFile, renameFile } = useMarkdownFiles();

  // 状態管理
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null); // 選択中のファイルID（名前変更用）
  const [showRenameModal, setShowRenameModal] = useState(false); // 名前変更モーダルの表示状態
  const [newFileName, setNewFileName] = useState(""); // 新しいファイル名
  const [searchQuery, setSearchQuery] = useState(""); // 検索クエリ

  /**
   * 新しいファイルを作成してエディタ画面に遷移
   * タイムスタンプを含むファイル名を自動生成
   */
  const handleCreateFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const locale = language === "ja" ? "ja-JP" : "en-US";
    const timestamp = new Date().toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newFile = await createFile(`${t("home.newFilePrefix")}${timestamp}.md`);
    if (newFile) {
      router.push({ pathname: "/editor", params: { fileId: newFile.id } });
    }
  };

  /**
   * ファイルを開く（エディタ画面に遷移）
   * @param fileId - 開くファイルのID
   */
  const handleOpenFile = (fileId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/editor", params: { fileId } });
  };

  /**
   * ファイルを削除（確認ダイアログを表示）
   * @param fileId - 削除するファイルのID
   * @param fileName - 削除するファイルの名前（表示用）
   */
  const handleDeleteFile = (fileId: string, fileName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t("home.deleteConfirmTitle"),
      t("home.deleteConfirmMessage", { fileName }),
      [
        { text: t("common.cancel"), onPress: () => {}, style: "cancel" },
        {
          text: t("common.delete"),
          onPress: async () => {
            await deleteFile(fileId);
            setSelectedFileId(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          style: "destructive",
        },
      ]
    );
  };

  /**
   * ファイル名変更モーダルを開く
   * @param fileId - 名前を変更するファイルのID
   * @param currentName - 現在のファイル名
   */
  const handleRenameStart = (fileId: string, currentName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFileId(fileId);
    setNewFileName(currentName);
    setShowRenameModal(true);
  };

  /**
   * ファイル名を変更（モーダルで確認後）
   */
  const handleRenameConfirm = async () => {
    if (!selectedFileId || !newFileName.trim()) {
      Alert.alert(t("common.error"), t("editor.renameError"));
      return;
    }

    await renameFile(selectedFileId, newFileName);
    setShowRenameModal(false);
    setSelectedFileId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /**
   * 設定画面に遷移
   */
  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/settings");
  };

  /**
   * 検索クエリでファイルをフィルタリング
   * ファイル名の大文字小文字を区別しない検索
   */
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * ファイルリストアイテムをレンダリング
   * - タップでファイルを開く
   * - 長押しで名前変更モーダルを開く
   * - 削除ボタンでファイルを削除
   */
  const renderFileItem = ({ item }: { item: typeof files[0] }) => {
    const locale = language === "ja" ? "ja-JP" : "en-US";
    const formattedDate = new Date(item.updatedAt).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Pressable
        onPress={() => handleOpenFile(item.id)}
        onLongPress={() => handleRenameStart(item.id, item.name)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteFile(item.id, item.name)}
            className="p-2 -mr-2"
          >
            <Text className="text-lg">🗑️</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-muted">{formattedDate}</Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      {/* ヘッダー */}
      <View className="px-4 py-4 border-b border-border flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">{t("home.title")}</Text>
        <TouchableOpacity onPress={handleOpenSettings} className="p-2">
          <Text className="text-2xl">⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 検索バー */}
      <View className="px-4 py-3 border-b border-border">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor={colors.muted}
          className="bg-surface px-4 py-2 rounded-lg text-base text-foreground"
          style={{ borderColor: colors.border, borderWidth: 1 }}
        />
      </View>

      {/* ファイル一覧 */}
      <View className="flex-1 px-4 py-4">
        {filteredFiles.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-4xl">📝</Text>
            <Text className="text-lg font-semibold text-foreground">{t("home.noFiles")}</Text>
            <Text className="text-sm text-muted text-center">
              {t("home.noFilesDescription")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFiles}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.id}
            scrollEnabled
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
      </View>

      {/* 新規作成ボタン */}
      <View className="px-4 py-4 border-t border-border">
        <TouchableOpacity
          onPress={handleCreateFile}
          className="bg-primary rounded-full py-4 items-center justify-center active:opacity-80"
        >
          <Text className="text-lg font-semibold text-background">{t("home.createNew")}</Text>
        </TouchableOpacity>
      </View>

      {/* ファイル名変更モーダル */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <View
            className="w-80 rounded-lg p-6 gap-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-lg font-bold text-foreground">{t("editor.renameTitle")}</Text>

            <TextInput
              value={newFileName}
              onChangeText={setNewFileName}
              placeholder={t("editor.renamePlaceholder")}
              placeholderTextColor={colors.muted}
              className="px-4 py-2 rounded-lg text-base text-foreground border border-border"
              style={{ borderColor: colors.border, borderWidth: 1 }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowRenameModal(false)}
                className="flex-1 py-3 rounded-lg border border-border items-center"
              >
                <Text className="font-semibold text-foreground">{t("common.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRenameConfirm}
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="font-semibold text-background">{t("common.confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
