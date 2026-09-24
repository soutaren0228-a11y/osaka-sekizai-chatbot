import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** 「未公開の変更」ログへの記録（各admin APIから呼ぶ） */
export async function recordDraftChangeServer(
  botId: string,
  summary: string
): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from("draft_changes").insert({ bot_id: botId, summary });
}
