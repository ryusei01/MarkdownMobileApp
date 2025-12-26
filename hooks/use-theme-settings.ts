import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "./use-color-scheme";

export interface ThemeSettings {
  mode: "light" | "dark" | "auto";
  fontSize: number; // 12-20
}

const STORAGE_KEY = "theme_settings";
const DEFAULT_SETTINGS: ThemeSettings = {
  mode: "auto",
  fontSize: 16,
};

/**
 * テーマ設定を管理するフック
 */
export function useThemeSettings() {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const systemColorScheme = useColorScheme();

  // 設定を読み込む
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedSettings = JSON.parse(data) as ThemeSettings;
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error("Failed to load theme settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // テーマモードを変更
  const setThemeMode = useCallback(
    async (mode: "light" | "dark" | "auto") => {
      try {
        const newSettings = { ...settings, mode };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
      } catch (error) {
        console.error("Failed to save theme mode:", error);
      }
    },
    [settings]
  );

  // フォントサイズを変更
  const setFontSize = useCallback(
    async (fontSize: number) => {
      // 12-20の範囲に制限
      const clampedSize = Math.max(12, Math.min(20, fontSize));
      try {
        const newSettings = { ...settings, fontSize: clampedSize };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
      } catch (error) {
        console.error("Failed to save font size:", error);
      }
    },
    [settings]
  );

  // 現在のテーマモードを取得（auto の場合はシステム設定を使用）
  const getCurrentThemeMode = useCallback((): "light" | "dark" => {
    if (settings.mode === "auto") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return settings.mode;
  }, [settings.mode, systemColorScheme]);

  return {
    settings,
    loading,
    setThemeMode,
    setFontSize,
    getCurrentThemeMode,
  };
}
