import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PersonaSettings } from "@/lib/data/persona";
import type { AppearanceSettings } from "@/lib/data/appearance";

export interface ChatFaqCandidate {
  question: string;
  answer: string;
  embedding: number[] | null;
}

export interface ChatContext {
  persona: PersonaSettings;
  appearance: AppearanceSettings;
  faqs: ChatFaqCandidate[];
}

/**
 * isTest=trueなら下書き（bots.draft_persona/draft_appearance + faqsテーブル）、
 * falseなら公開版（bot_versions.snapshot）からチャットに必要な設定一式を読み込む。
 */
export async function loadChatContext(
  botId: string,
  isTest: boolean
): Promise<ChatContext | null> {
  const supabase = getSupabaseServerClient();

  if (isTest) {
    const [{ data: bot }, { data: faqs }] = await Promise.all([
      supabase.from("bots").select("draft_persona, draft_appearance").eq("id", botId).single(),
      supabase.from("faqs").select("question, answer, embedding").eq("bot_id", botId),
    ]);
    if (!bot) return null;
    return {
      persona: bot.draft_persona as PersonaSettings,
      appearance: bot.draft_appearance as AppearanceSettings,
      faqs: (faqs ?? []) as ChatFaqCandidate[],
    };
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("current_published_version_id")
    .eq("id", botId)
    .single();
  if (!bot?.current_published_version_id) return null;

  const { data: version } = await supabase
    .from("bot_versions")
    .select("snapshot")
    .eq("id", bot.current_published_version_id)
    .single();
  if (!version) return null;

  const snapshot = version.snapshot as {
    persona: PersonaSettings;
    appearance: AppearanceSettings;
    faqs: ChatFaqCandidate[];
  };

  return snapshot;
}
