import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { embedDocuments } from "@/lib/ai/embeddings";
import { recordDraftChangeServer } from "@/lib/data/server/draftChanges";
import { mapFaqRow, truncateForLog } from "@/lib/data/faqs";
import type { FaqRow } from "@/lib/data/faqs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { id } = await params;
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
    .update({ question, answer, embedding, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, question, answer, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordDraftChangeServer(botId, `「${truncateForLog(question)}」を更新しました`);

  return NextResponse.json({ faq: mapFaqRow(data as FaqRow) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { data } = await supabase
    .from("faqs")
    .select("question")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data) {
    await recordDraftChangeServer(botId, `「${truncateForLog(data.question)}」を削除しました`);
  }

  return NextResponse.json({ ok: true });
}
