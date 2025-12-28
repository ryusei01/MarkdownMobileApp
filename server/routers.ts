/**
 * tRPCルーター定義
 * アプリケーションのすべてのAPIエンドポイントを定義
 */

import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

/**
 * アプリケーションのメインルーター
 * すべてのtRPCルーターを統合
 * 
 * 注意: socket.ioを使用する場合は、server/_core/index.tsでルートを読み込み、登録してください。
 * すべてのAPIは'/api/'で始まる必要があります（ゲートウェイが正しくルーティングできるようにするため）
 */
export const appRouter = router({
  // システム関連のルーター（ヘルスチェックなど）
  system: systemRouter,
  
  // 認証関連のルーター
  auth: router({
    /**
     * 現在認証されているユーザー情報を取得
     * @returns ユーザー情報（認証されていない場合はnull）
     */
    me: publicProcedure.query((opts) => opts.ctx.user),
    
    /**
     * ログアウト処理
     * セッションクッキーを削除して認証状態を無効化
     * @returns 成功フラグ
     */
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // クッキーを削除（maxAgeを-1に設定）
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: ここに機能別のルーターを追加してください
  // 例:
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

/**
 * ルーターの型定義（クライアント側で使用）
 */
export type AppRouter = typeof appRouter;
