import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PersonaSettings } from "@/lib/data/persona";
import type { AppearanceSettings } from "@/lib/data/appearance";

export interface PublishSnapshot {
  persona: PersonaSettings;
  appearance: AppearanceSettings;
  faqs: { question: string; answer: string; embedding: number[] | null }[];
}

/** 今の下書き（persona・appearance・faqs）をそのままスナップショットとして組み立てる */
export async function buildDraftSnapshot(botId: string): Promise<PublishSnapshot> {
  const supabase = getSupabaseServerClient();

  const [{ data: bot }, { data: faqs }] = await Promise.all([
    supabase.from("bots").select("draft_persona, draft_appearance").eq("id", botId).single(),
    supabase.from("faqs").select("question, answer, embedding").eq("bot_id", botId),
  ]);

  return {
    persona: bot?.draft_persona as PersonaSettings,
    appearance: bot?.draft_appearance as AppearanceSettings,
    faqs: (faqs ?? []).map((f) => ({
      question: f.question,
      answer: f.answer,
      embedding: f.embedding,
    })),
  };
}

/** 版を1件記録し、公開中の版として差し替え、未公開の変更ログをクリアする */
export async function recordVersionAndActivate(
  botId: string,
  publishedBy: string,
  changeSummaries: string[],
  snapshot: PublishSnapshot
): Promise<string> {
  const supabase = getSupabaseServerClient();

  const { data: version, error } = await supabase
    .from("bot_versions")
    .insert({
      bot_id: botId,
      published_by: publishedBy,
      change_summaries: changeSummaries,
      snapshot,
    })
    .select("id")
    .single();

  if (error || !version) {
    throw new Error(error?.message || "版の記録に失敗しました");
  }

  await supabase
    .from("bots")
    .update({ current_published_version_id: version.id })
    .eq("id", botId);

  await supabase.from("draft_changes").delete().eq("bot_id", botId);

  return version.id;
}
