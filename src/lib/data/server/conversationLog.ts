import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 会話ログへの記録。初回ターンでは、あいさつ文とお客さまの最初の発言を
 * まとめて1回で記録する（あいさつだけで終わった訪問を残さないため）。
 */
export async function logConversationTurn(params: {
  botId: string;
  conversationId: string;
  isTest: boolean;
  greeting: string;
  question: string;
  answer: string;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", params.conversationId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("conversations").insert({
      id: params.conversationId,
      bot_id: params.botId,
      is_test: params.isTest,
    });
    await supabase.from("messages").insert([
      { conversation_id: params.conversationId, role: "assistant", content: params.greeting },
      { conversation_id: params.conversationId, role: "user", content: params.question },
    ]);
  } else {
    await supabase.from("messages").insert({
      conversation_id: params.conversationId,
      role: "user",
      content: params.question,
    });
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", params.conversationId);
  }

  await supabase.from("messages").insert({
    conversation_id: params.conversationId,
    role: "assistant",
    content: params.answer,
  });
}
