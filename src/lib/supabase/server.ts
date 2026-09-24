import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * サーバー専用のSupabaseクライアント（SERVICE_ROLE_KEYを使用しRLSをバイパスする）。
 *
 * 設計方針（CLAUDE.md 13節）：ブラウザからSupabaseへ直接アクセスさせない。
 * 管理画面・チャットAPIのすべての読み書きは、このクライアントを使う
 * Next.jsのサーバー側コード（Route Handler / Server Action）を経由する。
 * 権限判定（editor/viewer）はアプリ側（members テーブルとの突き合わせ）で行う。
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabaseの環境変数が設定されていません。.env.local に NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください（.env.example参照）。"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** このアプリで扱う唯一のボットのslug */
export const BOT_SLUG = process.env.BOT_SLUG || "osaka-sekizai";

let cachedBotId: string | null = null;

/** botsテーブルの行のid（slugから解決してキャッシュする） */
export async function getBotId(): Promise<string> {
  if (cachedBotId) return cachedBotId;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bots")
    .select("id")
    .eq("slug", BOT_SLUG)
    .single();

  if (error || !data) {
    throw new Error(
      `bots テーブルに slug="${BOT_SLUG}" の行が見つかりません。supabase/migrations/0002_seed.sql を実行してください。`
    );
  }
  cachedBotId = data.id;
  return data.id;
}
