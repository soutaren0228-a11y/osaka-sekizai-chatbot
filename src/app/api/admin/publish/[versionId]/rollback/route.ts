import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { recordVersionAndActivate, type PublishSnapshot } from "@/lib/data/server/publishing";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { versionId } = await params;
  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { data: version, error } = await supabase
    .from("bot_versions")
    .select("snapshot, published_at")
    .eq("id", versionId)
    .eq("bot_id", botId)
    .single();

  if (error || !version) {
    return NextResponse.json({ error: "版が見つかりません" }, { status: 404 });
  }

  const snapshot = version.snapshot as PublishSnapshot;

  // 下書きのpersona・appearanceをこの版の内容で上書きする
  await supabase
    .from("bots")
    .update({ draft_persona: snapshot.persona, draft_appearance: snapshot.appearance })
    .eq("id", botId);

  // 下書きのfaqsも、この版に保存されていた内容（埋め込み込み）で作り直す
  await supabase.from("faqs").delete().eq("bot_id", botId);
  if (snapshot.faqs.length > 0) {
    await supabase.from("faqs").insert(
      snapshot.faqs.map((f) => ({
        bot_id: botId,
        question: f.question,
        answer: f.answer,
        embedding: f.embedding,
      }))
    );
  }

  const label = new Date(version.published_at).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  await recordVersionAndActivate(botId, auth.member.email, [`${label}の版に戻しました`], snapshot);

  return NextResponse.json({ ok: true });
}
