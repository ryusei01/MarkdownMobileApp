/**
 * フォントサイズ設定を管理するフック
 */

import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ThemeSettings {
  fontSize: number; // 12-20
}

const STORAGE_KEY = "theme_settings";
const DEFAULT_SETTINGS: ThemeSettings = {
  fontSize: 16,
};

/**
 * フォントサイズ設定を管理するフック
 */
export function useThemeSettings() {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // 設定を読み込む
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedSettings = JSON.parse(data) as ThemeSettings;
        // 既存の設定からフォントサイズのみを読み込む（後方互換性のため）
        setSettings({ fontSize: parsedSettings.fontSize || DEFAULT_SETTINGS.fontSize });
      }
    } catch (error) {
      console.error("Failed to load font size settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // フォントサイズを変更
  const setFontSize = useCallback(
    async (fontSize: number) => {
      // 12-20の範囲に制限
      const clampedSize = Math.max(12, Math.min(20, fontSize));
      try {
        const newSettings = { fontSize: clampedSize };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
      } catch (error) {
        console.error("Failed to save font size:", error);
      }
    },
    []
  );

  return {
    settings,
    loading,
    setFontSize,
  };
}
