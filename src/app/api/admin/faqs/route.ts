import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { embedDocuments } from "@/lib/ai/embeddings";
import { recordDraftChangeServer } from "@/lib/data/server/draftChanges";
import type { FaqRow } from "@/lib/data/faqs";
import { mapFaqRow, truncateForLog } from "@/lib/data/faqs";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer, created_at, updated_at")
    .eq("bot_id", botId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ faqs: (data as FaqRow[]).map(mapFaqRow) });
}

export async function POST(request: NextRequest) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const body = (await request.json()) as { question?: string; answer?: string };
  const question = (body.question ?? "").trim();
  const answer = (body.answer ?? "").trim();
  if (!question || !answer) {
    return NextResponse.json({ error: "質問と回答を入力してください" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const [embedding] = await embedDocuments([question]);

  const { data, error } = await supabase
    .from("faqs")
    .insert({ bot_id: botId, question, answer, embedding })
    .select("id, question, answer, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordDraftChangeServer(botId, `「${truncateForLog(question)}」を追加しました`);

  return NextResponse.json({ faq: mapFaqRow(data as FaqRow) });
}
