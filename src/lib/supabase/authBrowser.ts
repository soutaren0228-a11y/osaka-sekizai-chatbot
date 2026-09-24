"use client";

import { createBrowserClient } from "@supabase/ssr";

/** ログイン画面（マジックリンクの送信・受信）専用のブラウザ用クライアント */
export function getSupabaseAuthBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabaseの環境変数が設定されていません。");
  }

  return createBrowserClient(url, anonKey);
}
