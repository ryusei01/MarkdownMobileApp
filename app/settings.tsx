/**
 * 設定画面コンポーネント
 * 言語設定、テーマ設定、フォントサイズ設定、アプリ情報を提供
 */

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
import { useLanguage } from "@/lib/language-provider";
import * as Haptics from "expo-haptics";

/**
 * 設定画面
 * - 言語選択（日本語/英語）
 * - テーマモード選択（ライト/ダーク/自動）
 * - フォントサイズ調整（12-20px）
 * - アプリ情報表示
 */
export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { settings, setThemeMode, setFontSize } = useThemeSettings();
  const { t, language, setLanguage } = useLanguage();
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

  const handleLanguageChange = async (lang: "ja" | "en") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setLanguage(lang);
  };

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right", "bottom"]} testID="settings-screen">
      <View className="flex-1" testID="settings-container">
        {/* ヘッダー */}
        <View className="px-4 py-3 border-b border-border flex-row items-center" testID="settings-header">
          <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2" testID="settings-back-button">
            <Text className="text-lg text-primary font-semibold">← {t("common.back")}</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground ml-2" testID="settings-title">{t("settings.title")}</Text>
        </View>

        {/* コンテンツ */}
        <ScrollView className="flex-1 px-4 py-4" testID="settings-scroll-view">
          {/* 言語設定セクション */}
          <View className="mb-6" testID="settings-language-section">
            <Text className="text-lg font-bold text-foreground mb-3" testID="settings-language-title">{t("settings.language")}</Text>

            {/* 日本語 */}
            <Pressable
              onPress={() => handleLanguageChange("ja")}
              testID="settings-language-ja"
              style={({ pressed }) => [
                styles.settingItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: language === "ja" ? colors.primary : colors.border,
                  borderWidth: language === "ja" ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">{t("settings.japanese")}</Text>
                {language === "ja" && (
                  <Text className="text-lg text-primary" testID="settings-language-ja-check">✓</Text>
                )}
              </View>
            </Pressable>

            {/* 英語 */}
            <Pressable
              onPress={() => handleLanguageChange("en")}
              testID="settings-language-en"
              style={({ pressed }) => [
                styles.settingItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: language === "en" ? colors.primary : colors.border,
                  borderWidth: language === "en" ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                  marginTop: 8,
                },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">{t("settings.english")}</Text>
                {language === "en" && (
                  <Text className="text-lg text-primary" testID="settings-language-en-check">✓</Text>
                )}
              </View>
            </Pressable>
          </View>

          {/* テーマ設定セクション */}
          <View className="mb-6" testID="settings-theme-section">
            <Text className="text-lg font-bold text-foreground mb-3" testID="settings-theme-title">{t("settings.theme")}</Text>

            {/* ライトモード */}
            <Pressable
              onPress={() => handleThemeModeChange("light")}
              testID="settings-theme-light"
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
                <Text className="text-base font-semibold text-foreground">{t("settings.lightMode")}</Text>
                {settings.mode === "light" && (
                  <Text className="text-lg text-primary" testID="settings-theme-light-check">✓</Text>
                )}
              </View>
            </Pressable>

            {/* ダークモード */}
            <Pressable
              onPress={() => handleThemeModeChange("dark")}
              testID="settings-theme-dark"
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
                <Text className="text-base font-semibold text-foreground">{t("settings.darkMode")}</Text>
                {settings.mode === "dark" && (
                  <Text className="text-lg text-primary" testID="settings-theme-dark-check">✓</Text>
                )}
              </View>
            </Pressable>

            {/* 自動モード */}
            <Pressable
              onPress={() => handleThemeModeChange("auto")}
              testID="settings-theme-auto"
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
                <Text className="text-base font-semibold text-foreground">{t("settings.autoMode")}</Text>
                {settings.mode === "auto" && (
                  <Text className="text-lg text-primary" testID="settings-theme-auto-check">✓</Text>
                )}
              </View>
            </Pressable>
          </View>

          {/* フォントサイズセクション */}
          <View className="mb-6" testID="settings-font-size-section">
            <Text className="text-lg font-bold text-foreground mb-3" testID="settings-font-size-title">{t("settings.fontSize")}</Text>

            <View className="bg-surface rounded-lg p-4 border border-border" testID="settings-font-size-container">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base text-muted" testID="settings-font-size-label">{t("settings.currentFontSize", { size: fontSize.toString() })}</Text>
                <Text className="text-2xl font-bold text-foreground" style={{ fontSize }} testID="settings-font-size-preview">
                  Aa
                </Text>
              </View>

              <View className="flex-row items-center justify-center gap-4">
                <TouchableOpacity
                  onPress={() => handleFontSizeChange(-1)}
                  disabled={fontSize <= 12}
                  className="bg-primary rounded-lg px-4 py-2"
                  activeOpacity={0.8}
                  testID="settings-font-size-decrease"
                >
                  <Text className="text-lg font-bold text-background">−</Text>
                </TouchableOpacity>

                <View className="flex-1 h-1 bg-border rounded-full mx-2" testID="settings-font-size-slider" />

                <TouchableOpacity
                  onPress={() => handleFontSizeChange(1)}
                  disabled={fontSize >= 20}
                  className="bg-primary rounded-lg px-4 py-2"
                  activeOpacity={0.8}
                  testID="settings-font-size-increase"
                >
                  <Text className="text-lg font-bold text-background">+</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-muted text-center mt-3" testID="settings-font-size-range">
                {t("settings.fontSizeRange")}
              </Text>
            </View>
          </View>

          {/* アプリ情報セクション */}
          <View className="mb-6" testID="settings-app-info-section">
            <Text className="text-lg font-bold text-foreground mb-3" testID="settings-app-info-title">{t("settings.appInfo")}</Text>

            <View className="bg-surface rounded-lg p-4 border border-border" testID="settings-app-info-container">
              <View className="mb-3" testID="settings-app-name">
                <Text className="text-sm text-muted">{t("settings.appName")}</Text>
                <Text className="text-base font-semibold text-foreground" testID="settings-app-name-value">{t("settings.appNameValue")}</Text>
              </View>

              <View className="mb-3" testID="settings-app-version">
                <Text className="text-sm text-muted">{t("settings.version")}</Text>
                <Text className="text-base font-semibold text-foreground" testID="settings-app-version-value">{t("settings.versionValue")}</Text>
              </View>

              <View testID="settings-app-description">
                <Text className="text-sm text-muted">{t("settings.description")}</Text>
                <Text className="text-base text-foreground leading-relaxed" testID="settings-app-description-value">
                  {t("settings.descriptionValue")}
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
