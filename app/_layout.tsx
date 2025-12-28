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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:42',message:'RootLayoutContent entry',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { settings, loading: languageSettingsLoading } = useLanguageSettings();
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:45',message:'useLanguageSettings result',data:{loading:languageSettingsLoading,hasSelectedLanguage:settings.hasSelectedLanguage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // 初回起動時に言語選択モーダルを表示
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:51',message:'Language modal effect',data:{loading:languageSettingsLoading,hasSelectedLanguage:settings.hasSelectedLanguage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!languageSettingsLoading && !settings.hasSelectedLanguage) {
      setShowLanguageModal(true);
    }
  }, [languageSettingsLoading, settings.hasSelectedLanguage]);

  return (
    <>
      <LanguageSelectModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        testID="root-language-select-modal"
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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:72',message:'RootLayoutInner entry',data:{platform:Platform.OS,hasInitialMetrics:!!initialWindowMetrics},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // SafeAreaの初期値を取得（Webの場合はデフォルト値を使用）
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:75',message:'SafeArea initial values',data:{hasInitialInsets:!!initialInsets,hasInitialFrame:!!initialFrame},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  // SafeAreaの状態を管理
  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Manus Runtimeの初期化（親コンテナからのクッキー注入を有効化）
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:84',message:'initManusRuntime called',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    try {
      initManusRuntime();
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:87',message:'initManusRuntime success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:90',message:'initManusRuntime error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    }
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
  const [trpcClient] = useState(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:115',message:'createTRPCClient called',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      const client = createTRPCClient();
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:118',message:'createTRPCClient success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return client;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:122',message:'createTRPCClient error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  });

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
    <GestureHandlerRootView style={{ flex: 1 }} testID="root-gesture-handler">
      {/* tRPCプロバイダー（型安全なAPI呼び出しを有効化） */}
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {/* React Queryプロバイダー（サーバーステート管理） */}
        <QueryClientProvider client={queryClient}>
          {/* Expo Routerのスタックナビゲーション */}
          {/* デフォルトでネイティブヘッダーを非表示（ルートセグメントが表示されないようにするため） */}
          {/* ヘッダーが必要な画面では、Stack.Screenのオプションで明示的に有効化 */}
          <Stack screenOptions={{ headerShown: false }} testID="root-stack-navigator">
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
      <SafeAreaProvider initialMetrics={providerInitialMetrics} testID="root-safe-area-provider">
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>
            {content}
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={providerInitialMetrics} testID="root-safe-area-provider">{content}</SafeAreaProvider>
  );
}

/**
 * ルートレイアウトコンポーネント（エクスポート）
 */
export default function RootLayout() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:180',message:'RootLayout entry',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    return (
      <ThemeProvider testID="root-theme-provider">
        <LanguageProvider testID="root-language-provider">
          <RootLayoutContent />
        </LanguageProvider>
      </ThemeProvider>
    );
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:188',message:'RootLayout error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

