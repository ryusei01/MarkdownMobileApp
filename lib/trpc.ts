/**
 * tRPCクライアント設定
 * 型安全なAPI呼び出しを提供するtRPC Reactクライアント
 */

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

/**
 * tRPC Reactクライアント（型安全なAPI呼び出し用）
 * 
 * 重要（tRPC v11）: `transformer`は`httpBatchLink`の中に配置する必要があります。
 * ルートのcreateClientレベルには配置しないでください。
 * これにより、クライアントとサーバーが同じシリアライゼーション形式（superjson）を使用できます。
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * tRPCクライアントを作成
 * アプリのルートレイアウトで一度だけ呼び出す必要があります
 * @returns 設定済みのtRPCクライアント
 */
export function createTRPCClient() {
  const apiBaseUrl = getApiBaseUrl();
  const trpcUrl = `${apiBaseUrl}/api/trpc`;
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: trpcUrl, // tRPCエンドポイントのURL
        // tRPC v11: transformerはhttpBatchLinkの中に配置する必要があります（ルートレベルではありません）
        transformer: superjson, // 日付やBigIntなどの特殊な型をシリアライズ
        /**
         * リクエストヘッダーを設定
         * ネイティブプラットフォームではBearerトークンを設定
         */
        async headers() {
          try {
            const token = await Auth.getSessionToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          } catch (error) {
            return {};
          }
        },
        /**
         * カスタムfetch関数
         * クッキーベースの認証のためにcredentialsをインクルード
         */
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include", // クッキーをリクエストに含める
          });
        },
      }),
    ],
  });
}
