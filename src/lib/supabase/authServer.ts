import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * ログイン状態（Cookieのセッション）を読み書きするためのサーバー用クライアント。
 * anonキーを使うが、データの読み書きには使わない（ログインの確認専用）。
 */
export async function getSupabaseAuthServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabaseの環境変数が設定されていません（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY）。"
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からの呼び出しでは Cookie を書き換えられないことがある。
          // ミドルウェアやRoute Handlerでセッションが更新されるため、ここでは無視してよい。
        }
      },
    },
  });
}
