import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useThemeSettings } from "@/hooks/use-theme-settings";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { settings, setThemeMode, setFontSize } = useThemeSettings();
  const [fontSize, setFontSizeLocal] = useState(settings.fontSize);

  useEffect(() => {
    setFontSizeLocal(settings.fontSize);
  }, [settings.fontSize]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleThemeModeChange = (mode: "light" | "dark" | "auto") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  const handleFontSizeChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSize = fontSize + delta;
    setFontSizeLocal(newSize);
    setFontSize(newSize);
  };

  const getThemeModeLabel = (mode: string) => {
    switch (mode) {
      case "light":
        return "ライトモード";
      case "dark":
        return "ダークモード";
      case "auto":
        return "自動（システム設定）";
      default:
        return mode;
    }
  };

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* ヘッダー */}
        <View className="px-4 py-3 border-b border-border flex-row items-center">
          <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
            <Text className="text-lg text-primary font-semibold">← 戻る</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground ml-2">設定</Text>
        </View>

        {/* コンテンツ */}
        <ScrollView className="flex-1 px-4 py-4">
          {/* テーマ設定セクション */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">テーマ</Text>

            {/* ライトモード */}
            <Pressable
              onPress={() => handleThemeModeChange("light")}
              style={({ pressed }) => [
                styles.settingItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: settings.mode === "light" ? colors.primary : colors.border,
                  borderWidth: settings.mode === "light" ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">☀️ ライトモード</Text>
                {settings.mode === "light" && (
                  <Text className="text-lg text-primary">✓</Text>
                )}
              </View>
            </Pressable>

            {/* ダークモード */}
            <Pressable
              onPress={() => handleThemeModeChange("dark")}
              style={({ pressed }) => [
                styles.settingItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: settings.mode === "dark" ? colors.primary : colors.border,
                  borderWidth: settings.mode === "dark" ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                  marginTop: 8,
                },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">🌙 ダークモード</Text>
                {settings.mode === "dark" && (
                  <Text className="text-lg text-primary">✓</Text>
                )}
              </View>
            </Pressable>

            {/* 自動モード */}
            <Pressable
              onPress={() => handleThemeModeChange("auto")}
              style={({ pressed }) => [
                styles.settingItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: settings.mode === "auto" ? colors.primary : colors.border,
                  borderWidth: settings.mode === "auto" ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                  marginTop: 8,
                },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">🔄 自動</Text>
                {settings.mode === "auto" && (
                  <Text className="text-lg text-primary">✓</Text>
                )}
              </View>
            </Pressable>
          </View>

          {/* フォントサイズセクション */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">フォントサイズ</Text>

            <View className="bg-surface rounded-lg p-4 border border-border">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base text-muted">現在: {fontSize}px</Text>
                <Text className="text-2xl font-bold text-foreground" style={{ fontSize }}>
                  Aa
                </Text>
              </View>

              <View className="flex-row items-center justify-center gap-4">
                <TouchableOpacity
                  onPress={() => handleFontSizeChange(-1)}
                  disabled={fontSize <= 12}
                  className="bg-primary rounded-lg px-4 py-2"
                  activeOpacity={0.8}
                >
                  <Text className="text-lg font-bold text-background">−</Text>
                </TouchableOpacity>

                <View className="flex-1 h-1 bg-border rounded-full mx-2" />

                <TouchableOpacity
                  onPress={() => handleFontSizeChange(1)}
                  disabled={fontSize >= 20}
                  className="bg-primary rounded-lg px-4 py-2"
                  activeOpacity={0.8}
                >
                  <Text className="text-lg font-bold text-background">+</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-muted text-center mt-3">
                12px - 20px の範囲で調整できます
              </Text>
            </View>
          </View>

          {/* アプリ情報セクション */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">アプリ情報</Text>

            <View className="bg-surface rounded-lg p-4 border border-border">
              <View className="mb-3">
                <Text className="text-sm text-muted">アプリ名</Text>
                <Text className="text-base font-semibold text-foreground">Markdown Editor</Text>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted">バージョン</Text>
                <Text className="text-base font-semibold text-foreground">1.0.0</Text>
              </View>

              <View>
                <Text className="text-sm text-muted">説明</Text>
                <Text className="text-base text-foreground leading-relaxed">
                  シンプルで使いやすいMarkdownエディタです。リアルタイムプレビュー、クラウド同期、複数の形式でのダウンロードに対応しています。
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
