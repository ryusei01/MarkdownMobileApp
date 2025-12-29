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
  const { settings, setLanguage, loading } = useLanguageSettings();

  const t = (key: string, params?: Record<string, string>): string => {
    const currentTranslations = translations[settings.language];
    return getTranslation(currentTranslations, key, params);
  };

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
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}



