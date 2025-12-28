/**
 * 認証管理フック
 * Webとネイティブプラットフォームで異なる認証方式をサポート
 * - Web: クッキーベースの認証
 * - Native: トークンベースの認証
 */

import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

/**
 * useAuthフックのオプション
 */
type UseAuthOptions = {
  autoFetch?: boolean; // 自動的にユーザー情報を取得するかどうか
};

/**
 * 認証状態を管理するカスタムフック
 * @param options - フックのオプション
 * @returns 認証状態とユーザー情報、ログアウト関数
 */
export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  
  // 状態管理
  const [user, setUser] = useState<Auth.User | null>(null); // 現在のユーザー情報
  const [loading, setLoading] = useState(true); // 読み込み中フラグ
  const [error, setError] = useState<Error | null>(null); // エラー情報

  /**
   * ユーザー情報を取得
   * Web: APIから直接取得（クッキー認証）
   * Native: セッショントークンを確認してキャッシュされたユーザー情報を使用
   */
  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called");
    try {
      setLoading(true);
      setError(null);

      // Webプラットフォーム: クッキーベースの認証を使用し、APIからユーザー情報を取得
      if (Platform.OS === "web") {
        console.log("[useAuth] Web platform: fetching user from API...");
        const apiUser = await Api.getMe();
        console.log("[useAuth] API user response:", apiUser);

        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          setUser(userInfo);
          // 次回の読み込みを高速化するため、ユーザー情報をlocalStorageにキャッシュ
          await Auth.setUserInfo(userInfo);
          console.log("[useAuth] Web user set from API:", userInfo);
        } else {
          console.log("[useAuth] Web: No authenticated user from API");
          setUser(null);
          await Auth.clearUserInfo();
        }
        return;
      }

      // ネイティブプラットフォーム: トークンベースの認証を使用
      console.log("[useAuth] Native platform: checking for session token...");
      const sessionToken = await Auth.getSessionToken();
      console.log(
        "[useAuth] Session token:",
        sessionToken ? `present (${sessionToken.substring(0, 20)}...)` : "missing",
      );
      if (!sessionToken) {
        console.log("[useAuth] No session token, setting user to null");
        setUser(null);
        return;
      }

      // ネイティブではキャッシュされたユーザー情報を使用（トークンがセッションを検証）
      const cachedUser = await Auth.getUserInfo();
      console.log("[useAuth] Cached user:", cachedUser);
      if (cachedUser) {
        console.log("[useAuth] Using cached user info");
        setUser(cachedUser);
      } else {
        console.log("[useAuth] No cached user, setting user to null");
        setUser(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", error);
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[useAuth] fetchUser completed, loading:", false);
    }
  }, []);

  /**
   * ログアウト処理
   * APIを呼び出してセッションを無効化し、ローカルのトークンとユーザー情報をクリア
   */
  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
      // Continue with logout even if API call fails
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  // 認証済みかどうかを判定
  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  /**
   * 初期化時にユーザー情報を自動取得（オプション）
   * Web: APIから直接取得
   * Native: キャッシュされたユーザー情報を最初に表示し、必要に応じて取得
   */
  useEffect(() => {
    console.log("[useAuth] useEffect triggered, autoFetch:", autoFetch, "platform:", Platform.OS);
    if (autoFetch) {
      if (Platform.OS === "web") {
        // Web: fetch user from API directly (user will login manually if needed)
        console.log("[useAuth] Web: fetching user from API...");
        fetchUser();
      } else {
        // Native: check for cached user info first for faster initial load
        Auth.getUserInfo().then((cachedUser) => {
          console.log("[useAuth] Native cached user check:", cachedUser);
          if (cachedUser) {
            console.log("[useAuth] Native: setting cached user immediately");
            setUser(cachedUser);
            setLoading(false);
          } else {
            // No cached user, check session token
            fetchUser();
          }
        });
      }
    } else {
      console.log("[useAuth] autoFetch disabled, setting loading to false");
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  useEffect(() => {
    console.log("[useAuth] State updated:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      error: error?.message,
    });
  }, [user, loading, isAuthenticated, error]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
  };
}
