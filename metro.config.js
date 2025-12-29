const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Vercelのビルド環境やCI環境では、forceWriteFileSystemをfalseに設定
// これにより、仮想モジュールを使用してキャッシュファイルの生成問題を回避
const isCI = process.env.CI === "true" || process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

module.exports = withNativeWind(config, {
  input: "./global.css",
  // CI環境（Vercelなど）では仮想モジュールを使用してキャッシュファイルの問題を回避
  // ローカル開発環境ではファイルシステムに書き込んでiOSの問題を回避
  forceWriteFileSystem: !isCI,
});
