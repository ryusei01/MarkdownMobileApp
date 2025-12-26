import { Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useMarkdownFiles } from "@/hooks/use-markdown-files";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { files, loading, createFile } = useMarkdownFiles();
  const [creatingFile, setCreatingFile] = useState(false);

  const handleCreateFile = async () => {
    try {
      setCreatingFile(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const now = new Date();
      const defaultName = `新規ファイル_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      
      const newFile = await createFile(defaultName);
      
      // エディタ画面に遷移
      router.push({
        pathname: "/editor",
        params: { fileId: newFile.id },
      });
    } catch (error) {
      console.error("Failed to create file:", error);
    } finally {
      setCreatingFile(false);
    }
  };

  const handleOpenFile = (fileId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/editor",
      params: { fileId },
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPreview = (content: string, maxLength: number = 60) => {
    return content.substring(0, maxLength).replace(/\n/g, " ") || "（空のファイル）";
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* ヘッダー */}
        <View className="px-4 py-4 border-b border-border flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">Markdown Editor</Text>
            <Text className="text-sm text-muted mt-1">{files.length} 個のファイル</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="p-2 -mr-2">
            <Text className="text-2xl">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ファイル一覧 */}
        {files.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-lg text-muted text-center mb-4">
              ファイルがまだありません
            </Text>
            <Text className="text-sm text-muted text-center">
              下の「+」ボタンをタップして、新しいMarkdownファイルを作成してください。
            </Text>
          </View>
        ) : (
          <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleOpenFile(item.id)}
                activeOpacity={0.7}
                className="px-4 py-3 border-b border-border"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground mb-1">
                      {item.name}
                    </Text>
                    <Text className="text-sm text-muted mb-2" numberOfLines={2}>
                      {getPreview(item.content)}
                    </Text>
                    <Text className="text-xs text-muted">
                      更新: {formatDate(item.updatedAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}

        {/* 新規作成ボタン */}
        <View className="px-4 py-4 border-t border-border">
          <TouchableOpacity
            onPress={handleCreateFile}
            disabled={creatingFile}
            activeOpacity={0.8}
            className="bg-primary rounded-full py-4 items-center justify-center"
          >
            {creatingFile ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-lg font-semibold text-background">+ 新規作成</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
