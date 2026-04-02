/**
 * 設定画面コンポーネント
 * 言語設定、テーマ設定、フォントサイズ設定、アプリ情報を提供
 */

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useThemeSettings } from "@/hooks/use-theme-settings";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { getWebGoogleLoginUrl } from "@/constants/oauth";
import { signInWithGoogleNative } from "@/lib/google-native-sign-in";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Haptics from "expo-haptics";
import { useAdFree } from "@/lib/ad-free-context";

/**
 * 設定画面
 * - 言語選択（日本語/英語）
 * - フォントサイズ調整（12-20px）
 * - アプリ情報表示
 */
export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { settings, setFontSize } = useThemeSettings();
  const { t, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout, refresh } = useAuth();
  const {
    adFree,
    iapReady,
    entitlementsLoading,
    lifetimeSku,
    subscriptionSku,
    lifetimeProduct,
    subscriptionProduct,
    purchaseLifetime,
    purchaseSubscription,
    restorePurchases,
    purchaseError,
    clearPurchaseError,
  } = useAdFree();
  const [fontSize, setFontSizeLocal] = useState(settings.fontSize);
  const [authBusy, setAuthBusy] = useState(false);
  const [iapBusy, setIapBusy] = useState(false);

  useEffect(() => {
    setFontSizeLocal(settings.fontSize);
  }, [settings.fontSize]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAuthBusy(true);
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.location.href = getWebGoogleLoginUrl();
        }
        return;
      }
      const nat = await signInWithGoogleNative();
      const result = await Api.exchangeGoogleOAuthCode(nat);
      if (!result.sessionToken) {
        throw new Error("No session");
      }
      await Auth.setSessionToken(result.sessionToken);
      if (result.user) {
        const userInfo: Auth.User = {
          id: result.user.id ?? null,
          openId: result.user.openId,
          name: result.user.name,
          email: result.user.email,
          loginMethod: result.user.loginMethod ?? "google",
          lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
        };
        await Auth.setUserInfo(userInfo);
      }
      await refresh();
      router.replace("/(tabs)");
    } catch (e) {
      console.error("[settings] Google login failed", e);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAuthBusy(true);
    try {
      await logout();
    } finally {
      setAuthBusy(false);
    }
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
          <View className="mb-6" testID="settings-account-section">
            <Text className="text-lg font-bold text-foreground mb-3" testID="settings-account-title">
              {t("settings.account")}
            </Text>
            <View
              className="rounded-lg p-4 border border-border mb-2"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-sm text-muted mb-2">{t("settings.accountDescription")}</Text>
              {isAuthenticated && user ? (
                <>
                  <Text className="text-base text-foreground mb-1">
                    {user.name || user.email || user.openId}
                  </Text>
                  <Text className="text-xs text-muted mb-3">{t("settings.cloudSyncHint")}</Text>
                  <TouchableOpacity
                    onPress={handleLogout}
                    disabled={authBusy}
                    className="bg-border rounded-lg py-3 px-4"
                    testID="settings-logout-button"
                  >
                    <Text className="text-center font-semibold text-foreground">{t("settings.logout")}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  disabled={authBusy}
                  className="bg-primary rounded-lg py-3 px-4 flex-row items-center justify-center gap-2"
                  testID="settings-google-login-button"
                >
                  {authBusy ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text className="text-center font-semibold text-background">{t("settings.loginWithGoogle")}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-xs text-muted leading-5 mb-2">{t("settings.privacyNote")}</Text>
            <Text className="text-xs text-muted leading-5">{t("settings.subscriptionNote")}</Text>
          </View>

          {/* 広告オフ（サブスク / 買い切り） */}
          <View className="mb-6" testID="settings-ad-free-section">
            <Text className="text-lg font-bold text-foreground mb-3" testID="settings-ad-free-title">
              {t("settings.adFreeSection")}
            </Text>
            {Platform.OS === "web" ? (
              <Text className="text-sm text-muted leading-5">{t("settings.adFreeMobileOnly")}</Text>
            ) : adFree ? (
              <View
                className="rounded-lg p-4 border border-border"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-base text-foreground">{t("settings.adFreeActive")}</Text>
              </View>
            ) : (
              <View
                className="rounded-lg p-4 border border-border gap-3"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-sm text-muted leading-5">{t("settings.adFreeDescription")}</Text>
                {entitlementsLoading || !iapReady ? (
                  <View className="flex-row items-center gap-2 py-2">
                    <ActivityIndicator color={colors.primary} />
                    <Text className="text-sm text-muted">{t("settings.adFreeStoreLoading")}</Text>
                  </View>
                ) : (
                  <>
                    {subscriptionSku ? (
                      <View className="gap-2">
                        <Text className="text-sm font-semibold text-foreground">
                          {t("settings.adFreeSubscriptionTitle")}
                          {subscriptionProduct?.displayPrice
                            ? ` · ${subscriptionProduct.displayPrice}`
                            : ""}
                        </Text>
                        <Text className="text-xs text-muted">{t("settings.adFreeSubscriptionHint")}</Text>
                        {!subscriptionProduct?.displayPrice ? (
                          <Text className="text-xs text-muted">{t("settings.adFreeConfigureStore")}</Text>
                        ) : null}
                        <TouchableOpacity
                          onPress={async () => {
                            if (iapBusy) return;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            clearPurchaseError();
                            setIapBusy(true);
                            try {
                              await purchaseSubscription();
                            } finally {
                              setIapBusy(false);
                            }
                          }}
                          disabled={iapBusy}
                          className="bg-primary rounded-lg py-3 px-4"
                          testID="settings-ad-free-subscribe"
                        >
                          <Text className="text-center font-semibold text-background">
                            {t("settings.adFreeSubscribe")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    {lifetimeSku ? (
                      <View className={`gap-2 ${subscriptionSku ? "pt-2 border-t border-border" : ""}`}>
                        <Text className="text-sm font-semibold text-foreground">
                          {t("settings.adFreeLifetimeTitle")}
                          {lifetimeProduct?.displayPrice ? ` · ${lifetimeProduct.displayPrice}` : ""}
                        </Text>
                        <Text className="text-xs text-muted">{t("settings.adFreeLifetimeHint")}</Text>
                        {subscriptionSku && !lifetimeProduct?.displayPrice ? (
                          <Text className="text-xs text-muted">{t("settings.adFreeConfigureStore")}</Text>
                        ) : null}
                        {!subscriptionSku && !lifetimeProduct?.displayPrice ? (
                          <Text className="text-xs text-muted">{t("settings.adFreeConfigureStore")}</Text>
                        ) : null}
                        <TouchableOpacity
                          onPress={async () => {
                            if (iapBusy) return;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            clearPurchaseError();
                            setIapBusy(true);
                            try {
                              await purchaseLifetime();
                            } finally {
                              setIapBusy(false);
                            }
                          }}
                          disabled={iapBusy}
                          className="bg-primary rounded-lg py-3 px-4 opacity-95"
                          testID="settings-ad-free-lifetime"
                        >
                          <Text className="text-center font-semibold text-background">
                            {t("settings.adFreeBuyLifetime")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      onPress={async () => {
                        if (iapBusy) return;
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        clearPurchaseError();
                        setIapBusy(true);
                        try {
                          await restorePurchases();
                        } finally {
                          setIapBusy(false);
                        }
                      }}
                      disabled={iapBusy}
                      className="border border-border rounded-lg py-3 px-4"
                      testID="settings-ad-free-restore"
                    >
                      <Text className="text-center font-semibold text-foreground">
                        {t("settings.adFreeRestore")}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {purchaseError ? (
                  <Text className="text-sm" style={{ color: "#dc2626" }} testID="settings-ad-free-error">
                    {purchaseError}
                  </Text>
                ) : null}
              </View>
            )}
          </View>

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
