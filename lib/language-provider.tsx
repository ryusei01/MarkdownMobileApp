import React, { createContext, useContext, ReactNode } from "react";
import { useLanguageSettings, type Language } from "@/hooks/use-language-settings";
import jaTranslations from "@/i18n/ja.json";
import enTranslations from "@/i18n/en.json";

type Translations = typeof jaTranslations;

const translations: Record<Language, Translations> = {
  ja: jaTranslations,
  en: enTranslations,
};

type LanguageContextValue = {
  language: Language;
  t: (key: string, params?: Record<string, string>) => string;
  setLanguage: (language: Language) => Promise<void>;
  loading: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * 翻訳キーから値を取得する関数
 * 例: t("home.title") => "Markdown Editor"
 * 例: t("home.deleteConfirmMessage", { fileName: "test.md" }) => "test.md を削除します..."
 */
function getTranslation(
  translations: Translations,
  key: string,
  params?: Record<string, string>
): string {
  const keys = key.split(".");
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key; // キーが見つからない場合はキー自体を返す
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  // パラメータを置換
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey] || match;
    });
  }

  return value;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/language-provider.tsx:57',message:'LanguageProvider entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  try {
    const { settings, setLanguage, loading } = useLanguageSettings();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/language-provider.tsx:60',message:'useLanguageSettings result',data:{loading,language:settings.language},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

    const t = (key: string, params?: Record<string, string>): string => {
      const currentTranslations = translations[settings.language];
      return getTranslation(currentTranslations, key, params);
    };

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/language-provider.tsx:66',message:'LanguageProvider render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    return (
      <LanguageContext.Provider
        value={{
          language: settings.language,
          t,
          setLanguage,
          loading,
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/language-provider.tsx:78',message:'LanguageProvider error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}



