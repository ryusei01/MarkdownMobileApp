import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "ja" | "en";

export interface LanguageSettings {
  language: Language;
  hasSelectedLanguage: boolean; // 初回起動時に言語を選択したかどうか
}

const STORAGE_KEY = "language_settings";
const DEFAULT_SETTINGS: LanguageSettings = {
  language: "ja",
  hasSelectedLanguage: false,
};

/**
 * 言語設定を管理するフック
 */
export function useLanguageSettings() {
  const [settings, setSettings] = useState<LanguageSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // 設定を読み込む
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedSettings = JSON.parse(data) as LanguageSettings;
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error("Failed to load language settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 言語を変更
  const setLanguage = useCallback(
    async (language: Language) => {
      try {
        const newSettings = { ...settings, language, hasSelectedLanguage: true };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
      } catch (error) {
        console.error("Failed to save language:", error);
      }
    },
    [settings]
  );

  // 初回言語選択を完了したことを記録
  const markLanguageSelected = useCallback(async () => {
    try {
      const newSettings = { ...settings, hasSelectedLanguage: true };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to mark language selected:", error);
    }
  }, [settings]);

  return {
    settings,
    loading,
    setLanguage,
    markLanguageSelected,
  };
}



