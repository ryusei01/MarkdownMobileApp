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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/trpc.ts:27',message:'createTRPCClient entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const apiBaseUrl = getApiBaseUrl();
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/trpc.ts:30',message:'getApiBaseUrl result',data:{apiBaseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const trpcUrl = `${apiBaseUrl}/api/trpc`;
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/trpc.ts:33',message:'tRPC URL constructed',data:{trpcUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/trpc.ts:40',message:'getSessionToken called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          try {
            const token = await Auth.getSessionToken();
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/trpc.ts:43',message:'getSessionToken result',data:{hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return token ? { Authorization: `Bearer ${token}` } : {};
          } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/trpc.ts:46',message:'getSessionToken error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
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
