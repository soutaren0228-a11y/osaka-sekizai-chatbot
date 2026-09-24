import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function normalize(question: string): string {
  return question.trim().replace(/\s+/g, "");
}

export async function recordUnansweredServer(
  botId: string,
  question: string,
  isTest: boolean
): Promise<void> {
  const trimmed = question.trim();
  if (!trimmed) return;

  const supabase = getSupabaseServerClient();
  const normalized = normalize(trimmed);

  const { data: existing } = await supabase
    .from("unanswered_questions")
    .select("id, count, test_only")
    .eq("bot_id", botId)
    .eq("normalized_question", normalized)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("unanswered_questions")
      .update({
        count: existing.count + 1,
        last_asked_at: new Date().toISOString(),
        test_only: existing.test_only && isTest,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("unanswered_questions").insert({
      bot_id: botId,
      question: trimmed,
      normalized_question: normalized,
      test_only: isTest,
      status: "open",
    });
  }
}
