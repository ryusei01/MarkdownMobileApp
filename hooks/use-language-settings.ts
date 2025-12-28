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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks/use-language-settings.ts:25',message:'loadSettings entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks/use-language-settings.ts:29',message:'AsyncStorage.getItem result',data:{hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (data) {
        const parsedSettings = JSON.parse(data) as LanguageSettings;
        setSettings(parsedSettings);
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks/use-language-settings.ts:32',message:'Settings parsed and set',data:{hasSelectedLanguage:parsedSettings.hasSelectedLanguage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks/use-language-settings.ts:35',message:'loadSettings error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error("Failed to load language settings:", error);
    } finally {
      setLoading(false);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks/use-language-settings.ts:38',message:'loadSettings complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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



