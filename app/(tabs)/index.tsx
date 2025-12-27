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
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { files, createFile, deleteFile, renameFile } = useMarkdownFiles();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ファイルを作成
  const handleCreateFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const timestamp = new Date().toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newFile = await createFile(`新規ファイル_${timestamp}.md`);
    if (newFile) {
      router.push({ pathname: "/editor", params: { fileId: newFile.id } });
    }
  };

  // ファイルを開く
  const handleOpenFile = (fileId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/editor", params: { fileId } });
  };

  // ファイルを削除
  const handleDeleteFile = (fileId: string, fileName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "ファイルを削除しますか？",
      `"${fileName}" を削除します。この操作は取り消せません。`,
      [
        { text: "キャンセル", onPress: () => {}, style: "cancel" },
        {
          text: "削除",
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

  // ファイル名変更を開始
  const handleRenameStart = (fileId: string, currentName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFileId(fileId);
    setNewFileName(currentName);
    setShowRenameModal(true);
  };

  // ファイル名を変更
  const handleRenameConfirm = async () => {
    if (!selectedFileId || !newFileName.trim()) {
      Alert.alert("エラー", "ファイル名を入力してください");
      return;
    }

    await renameFile(selectedFileId, newFileName);
    setShowRenameModal(false);
    setSelectedFileId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // 設定画面を開く
  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/settings");
  };

  // フィルタリング
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ファイルアイテムをレンダリング
  const renderFileItem = ({ item }: { item: typeof files[0] }) => {
    const formattedDate = new Date(item.updatedAt).toLocaleString("ja-JP", {
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
        <Text className="text-2xl font-bold text-foreground">Markdown Editor</Text>
        <TouchableOpacity onPress={handleOpenSettings} className="p-2">
          <Text className="text-2xl">⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 検索バー */}
      <View className="px-4 py-3 border-b border-border">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="ファイルを検索..."
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
            <Text className="text-lg font-semibold text-foreground">ファイルがまだありません</Text>
            <Text className="text-sm text-muted text-center">
              下の「+ 新規作成」ボタンをタップして、新しいMarkdownファイルを作成してください。
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
          <Text className="text-lg font-semibold text-background">+ 新規作成</Text>
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
            <Text className="text-lg font-bold text-foreground">ファイル名を変更</Text>

            <TextInput
              value={newFileName}
              onChangeText={setNewFileName}
              placeholder="新しいファイル名"
              placeholderTextColor={colors.muted}
              className="px-4 py-2 rounded-lg text-base text-foreground border border-border"
              style={{ borderColor: colors.border, borderWidth: 1 }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowRenameModal(false)}
                className="flex-1 py-3 rounded-lg border border-border items-center"
              >
                <Text className="font-semibold text-foreground">キャンセル</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRenameConfirm}
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="font-semibold text-background">変更</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
