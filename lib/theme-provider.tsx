/**
 * テーマプロバイダーコンポーネント
 * ライトモード固定でフォントサイズを管理し、アプリ全体に提供
 */

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { Appearance, View } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { useThemeSettings } from "@/hooks/use-theme-settings";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  fontSize: number;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useThemeSettings();
  const colorScheme: ColorScheme = "light"; // ライトモード固定

  // ライトモードを適用
  useEffect(() => {
    nativewindColorScheme.set("light");
    Appearance.setColorScheme?.("light");
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = "light";
      root.classList.remove("dark");
      const palette = SchemeColors.light;
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
        "font-size-base": `${settings.fontSize}px`,
      }),
    [colorScheme, settings.fontSize],
  );

  // Web用のCSS変数も設定
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--font-size-base", `${settings.fontSize}px`);
    }
  }, [settings.fontSize]);

  const value = useMemo(
    () => ({
      colorScheme,
      fontSize: settings.fontSize,
    }),
    [colorScheme, settings.fontSize],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

/**
 * テーマコンテキストを使用するフック
 * @returns テーマコンテキストの値（カラースキーム、フォントサイズなど）
 */
export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
