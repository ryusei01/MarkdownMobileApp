// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
const bundleId = "space.manus.MarkdownMobileApp.t20251226011757";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

/** Google sample AdMob app IDs (replace with production IDs via env for release builds). */
const TEST_ADMOB_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";
const TEST_ADMOB_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";

const adMobIosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? TEST_ADMOB_IOS_APP_ID;
const adMobAndroidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? TEST_ADMOB_ANDROID_APP_ID;
/** 買い切り（非消耗型）— 広告オフ */
const iapAdFreeLifetimeProductId =
  process.env.EXPO_PUBLIC_IAP_AD_FREE_LIFETIME_PRODUCT_ID?.trim() ||
  process.env.EXPO_PUBLIC_IAP_AD_FREE_PRODUCT_ID?.trim() ||
  "ad_free_markdown_editor";
/** サブスク — 契約中は広告オフ（未設定のときは空でサブスク OFF） */
const iapAdFreeSubscriptionProductId =
  process.env.EXPO_PUBLIC_IAP_AD_FREE_SUBSCRIPTION_PRODUCT_ID?.trim() ?? "";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Markdown Editor",
  appSlug: "markdown-editor",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl:
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663262847080/evMocVAewwjojviC.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "$(PRODUCT_NAME) needs access to your photos so you can insert images into Markdown.",
        cameraPermission:
          "$(PRODUCT_NAME) needs camera access if you capture a photo to insert into Markdown.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          kotlinVersion: "2.2.0",
        },
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: adMobAndroidAppId,
        iosAppId: adMobIosAppId,
      },
    ],
    "expo-iap",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: false, // trueからfalseに変更
  },
  extra: {
    eas: {
      projectId: "d4e93a3a-89df-4b2e-8b97-dcd18b446a97",
    },
    adMobIosAppId,
    adMobAndroidAppId,
    adMobBannerIosUnitId:
      process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS_UNIT_ID ?? "ca-app-pub-3940256099942544/2934735716",
    adMobBannerAndroidUnitId:
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID_UNIT_ID ?? "ca-app-pub-3940256099942544/6300978111",
    iapAdFreeLifetimeProductId,
    iapAdFreeSubscriptionProductId,
  },
};

export default config;
