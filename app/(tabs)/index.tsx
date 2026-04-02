/**
 * ホーム画面コンポーネント
 * Markdownファイルの一覧表示、作成、削除、名前変更機能を提供
 */

import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useMarkdownFilesUniversal } from "@/hooks/use-markdown-files-universal";
import type { MarkdownFile } from "@/hooks/use-markdown-files";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/lib/language-provider";
import {
  joinPath,
  listChildrenAtFolder,
  getBaseName,
  getParentPath,
  normalizeFilePath,
} from "@/lib/markdown-file-path";
import * as Haptics from "expo-haptics";

type ListRow =
  | { kind: "folder"; name: string }
  | { kind: "file"; file: MarkdownFile };

/**
 * ホーム画面
 * - ファイル一覧の表示（仮想フォルダ対応）
 * - ファイルの検索機能
 * - ファイルの作成、削除、名前変更
 * - エディタ画面への遷移
 */
export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { t, language } = useLanguage();
  const { files, createFile, deleteFile, renameFile } = useMarkdownFilesUniversal();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderPath, setFolderPath] = useState("");

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setFolderPath("");
    }
  }, [searchQuery]);

  const isSearch = searchQuery.trim().length > 0;

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return files.filter((file) => file.name.toLowerCase().includes(q)).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [files, searchQuery]);

  const { subfolders, files: filesInFolder } = useMemo(
    () => listChildrenAtFolder(files, folderPath),
    [files, folderPath],
  );

  const listRows: ListRow[] = useMemo(() => {
    if (isSearch) {
      return searchMatches.map((f) => ({ kind: "file" as const, file: f }));
    }
    const rows: ListRow[] = [];
    for (const name of subfolders) {
      rows.push({ kind: "folder", name });
    }
    for (const file of filesInFolder) {
      rows.push({ kind: "file", file });
    }
    return rows;
  }, [isSearch, searchMatches, subfolders, filesInFolder]);

  const breadcrumbSegments = useMemo(() => {
    const fp = normalizeFilePath(folderPath);
    if (!fp) return [];
    return fp.split("/").filter(Boolean);
  }, [folderPath]);

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

    const baseName = `${t("home.newFilePrefix")}${timestamp}.md`;
    const fullName = joinPath(folderPath, baseName);
    const newFile = await createFile(fullName);
    if (newFile) {
      router.push({ pathname: "/editor", params: { fileId: newFile.id } });
    }
  };

  const handleOpenFile = (fileId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/editor", params: { fileId } });
  };

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
      ],
    );
  };

  const handleRenameStart = (fileId: string, currentName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFileId(fileId);
    setNewFileName(currentName);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (!selectedFileId || !newFileName.trim()) {
      Alert.alert(t("common.error"), t("editor.renameError"));
      return;
    }

    await renameFile(selectedFileId, normalizeFilePath(newFileName.trim()));
    setShowRenameModal(false);
    setSelectedFileId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/settings");
  };

  const navigateToBreadcrumbIndex = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index < 0) {
      setFolderPath("");
      return;
    }
    setFolderPath(breadcrumbSegments.slice(0, index + 1).join("/"));
  };

  const renderItem = ({ item }: { item: ListRow }) => {
    if (item.kind === "folder") {
      return (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFolderPath(joinPath(folderPath, item.name));
          }}
          testID={`home-folder-item-${item.name}`}
          style={({ pressed }: { pressed: boolean }) => [
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
          <View className="flex-row items-center gap-2" testID={`home-folder-row-${item.name}`}>
            <Text className="text-xl">📁</Text>
            <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-muted text-sm">{t("home.folderLabel")}</Text>
          </View>
        </Pressable>
      );
    }

    const f = item.file;
    const locale = language === "ja" ? "ja-JP" : "en-US";
    const formattedDate = new Date(f.updatedAt).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parent = getParentPath(f.name);
    const base = getBaseName(f.name);

    return (
      <Pressable
        onPress={() => handleOpenFile(f.id)}
        onLongPress={() => handleRenameStart(f.id, f.name)}
        testID={`home-file-item-${f.id}`}
        style={({ pressed }: { pressed: boolean }) => [
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
        <View className="flex-row items-center justify-between mb-2" testID={`home-file-item-header-${f.id}`}>
          <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1} testID={`home-file-item-name-${f.id}`}>
            {isSearch && parent ? `${base}  ·  ${parent}` : base}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteFile(f.id, f.name)}
            className="p-2 -mr-2"
            testID={`home-file-item-delete-${f.id}`}
          >
            <Text className="text-lg">🗑️</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-muted" testID={`home-file-item-date-${f.id}`}>
          {formattedDate}
          {!isSearch && parent ? ` · ${parent}` : ""}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="bg-background" testID="home-screen">
      <View className="px-4 py-4 border-b border-border flex-row items-center justify-between" testID="home-header">
        <Text className="text-2xl font-bold text-foreground" testID="home-title">
          {t("home.title")}
        </Text>
        <TouchableOpacity onPress={handleOpenSettings} className="p-2" testID="home-settings-button">
          <Text className="text-2xl">⚙️</Text>
        </TouchableOpacity>
      </View>

      {!isSearch && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-14 border-b border-border bg-surface px-2 py-2">
          <View className="flex-row items-center gap-2 px-2">
            <TouchableOpacity onPress={() => navigateToBreadcrumbIndex(-1)} testID="home-crumb-root">
              <Text
                className={`text-sm font-medium ${!folderPath ? "text-primary" : "text-muted"}`}
              >
                {t("home.folderRoot")}
              </Text>
            </TouchableOpacity>
            {breadcrumbSegments.map((seg, idx) => (
              <View key={seg + idx} className="flex-row items-center gap-2">
                <Text className="text-muted">/</Text>
                <TouchableOpacity onPress={() => navigateToBreadcrumbIndex(idx)} testID={`home-crumb-${idx}`}>
                  <Text
                    className={`text-sm font-medium ${
                      idx === breadcrumbSegments.length - 1 ? "text-primary" : "text-muted"
                    }`}
                    numberOfLines={1}
                  >
                    {seg}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {isSearch && (
        <View className="px-4 py-2 border-b border-border bg-surface">
          <Text className="text-xs text-muted" testID="home-search-hint">
            {t("home.searchResultsHint")}
          </Text>
        </View>
      )}

      <View className="px-4 py-3 border-b border-border" testID="home-search-container">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor={colors.muted}
          className="bg-surface px-4 py-2 rounded-lg text-base text-foreground"
          style={{ borderColor: colors.border, borderWidth: 1 }}
          testID="home-search-input"
        />
      </View>

      <View className="flex-1 px-4 py-4" testID="home-file-list-container">
        {listRows.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3" testID="home-empty-state">
            <Text className="text-4xl">📝</Text>
            <Text className="text-lg font-semibold text-foreground" testID="home-empty-state-title">
              {isSearch
                ? t("home.noSearchResults")
                : folderPath
                  ? t("home.noFilesInFolder")
                  : t("home.noFiles")}
            </Text>
            <Text className="text-sm text-muted text-center" testID="home-empty-state-description">
              {isSearch ? t("home.searchPlaceholder") : t("home.noFilesDescription")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={listRows}
            renderItem={renderItem}
            keyExtractor={(row: ListRow) =>
              row.kind === "folder" ? `dir:${row.name}` : `file:${row.file.id}`
            }
            scrollEnabled
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
            testID="home-file-list"
          />
        )}
      </View>

      <View className="px-4 py-4 border-t border-border" testID="home-create-button-container">
        <TouchableOpacity
          onPress={handleCreateFile}
          className="bg-primary rounded-full py-4 items-center justify-center active:opacity-80"
          testID="home-create-button"
        >
          <Text className="text-lg font-semibold text-background">{t("home.createNew")}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
        testID="home-rename-modal"
      >
        <View
          className="flex-1 items-center justify-center px-4"
          style={{ backgroundColor: colorScheme === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)" }}
          testID="home-rename-modal-backdrop"
        >
          <View
            className="w-full max-w-sm rounded-lg p-6 gap-4"
            style={{ backgroundColor: colors.surface }}
            testID="home-rename-modal-content"
          >
            <Text className="text-lg font-bold text-foreground" testID="home-rename-modal-title">
              {t("editor.renameTitle")}
            </Text>
            <Text className="text-xs text-muted">{t("home.renamePathHint")}</Text>

            <TextInput
              value={newFileName}
              onChangeText={setNewFileName}
              placeholder={t("editor.renamePlaceholder")}
              placeholderTextColor={colors.muted}
              className="px-4 py-2 rounded-lg text-base text-foreground border border-border"
              style={{ borderColor: colors.border, borderWidth: 1 }}
              testID="home-rename-modal-input"
            />

            <View className="flex-row gap-3" testID="home-rename-modal-actions">
              <TouchableOpacity
                onPress={() => setShowRenameModal(false)}
                className="flex-1 py-3 rounded-lg border border-border items-center"
                testID="home-rename-modal-cancel"
              >
                <Text className="font-semibold text-foreground">{t("common.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRenameConfirm}
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: colors.primary }}
                testID="home-rename-modal-confirm"
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
