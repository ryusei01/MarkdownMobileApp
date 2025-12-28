/**
 * アプリケーションのルートレイアウトコンポーネント
 * すべての画面の基盤となるレイアウトとプロバイダーを設定
 */

import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { LanguageProvider, useLanguage } from "@/lib/language-provider";
import { useLanguageSettings } from "@/hooks/use-language-settings";
import { LanguageSelectModal } from "@/components/language-select-modal";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

// Webプラットフォーム用のデフォルト値（SafeAreaの初期値として使用）
const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

// Expo Router の設定
export const unstable_settings = {
  anchor: "(tabs)", // タブナビゲーションのアンカーポイント
};

/**
 * 言語選択モーダルを管理するコンポーネント
 */
function RootLayoutContent() {
  const { settings, loading: languageSettingsLoading } = useLanguageSettings();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // 初回起動時に言語選択モーダルを表示
  useEffect(() => {
    if (!languageSettingsLoading && !settings.hasSelectedLanguage) {
      setShowLanguageModal(true);
    }
  }, [languageSettingsLoading, settings.hasSelectedLanguage]);

  return (
    <>
      <LanguageSelectModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
      <RootLayoutInner />
    </>
  );
}

/**
 * ルートレイアウトコンポーネント（内部実装）
 * - tRPC/React Queryのプロバイダー設定
 * - テーマプロバイダーの設定
 * - SafeAreaの管理（Webとネイティブで異なる処理）
 * - Manus Runtimeの初期化（親コンテナからのクッキー注入用）
 */
function RootLayoutInner() {
  // SafeAreaの初期値を取得（Webの場合はデフォルト値を使用）
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  // SafeAreaの状態を管理
  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Manus Runtimeの初期化（親コンテナからのクッキー注入を有効化）
  useEffect(() => {
    initManusRuntime();
  }, []);

  // SafeAreaの更新ハンドラ（Webプラットフォーム用）
  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  // WebプラットフォームでのSafeArea変更を監視
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // React Queryクライアントの作成（一度だけ作成して再利用）
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // モバイルアプリではウィンドウフォーカス時の自動リフェッチを無効化
            refetchOnWindowFocus: false,
            // 失敗したリクエストは1回だけリトライ
            retry: 1,
          },
        },
      }),
  );

  // tRPCクライアントの作成（一度だけ作成して再利用）
  const [trpcClient] = useState(() => createTRPCClient());

  // SafeAreaProviderの初期メトリクス（モバイルで最小パディングを確保）
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        // 上部に最小16pxのパディングを確保
        top: Math.max(metrics.insets.top, 16),
        // 下部に最小12pxのパディングを確保
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  // メインコンテンツ（すべてのプロバイダーでラップ）
  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* tRPCプロバイダー（型安全なAPI呼び出しを有効化） */}
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {/* React Queryプロバイダー（サーバーステート管理） */}
        <QueryClientProvider client={queryClient}>
          {/* Expo Routerのスタックナビゲーション */}
          {/* デフォルトでネイティブヘッダーを非表示（ルートセグメントが表示されないようにするため） */}
          {/* ヘッダーが必要な画面では、Stack.Screenのオプションで明示的に有効化 */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          {/* ステータスバーのスタイル（システム設定に従う） */}
          <StatusBar style="auto" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  // WebプラットフォームではSafeAreaを手動で管理
  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}

/**
 * ルートレイアウトコンポーネント（エクスポート）
 */
export default function RootLayout() {
  return (
    <LanguageProvider>
      <RootLayoutContent />
    </LanguageProvider>
  );
}
