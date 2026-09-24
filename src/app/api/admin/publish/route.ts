import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { buildDraftSnapshot, recordVersionAndActivate } from "@/lib/data/server/publishing";

export async function POST() {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { data: pending } = await supabase
    .from("draft_changes")
    .select("summary")
    .eq("bot_id", botId);

  const changeSummaries = (pending ?? []).map((c) => c.summary);
  const snapshot = await buildDraftSnapshot(botId);

  await recordVersionAndActivate(botId, auth.member.email, changeSummaries, snapshot);

  return NextResponse.json({ ok: true });
}
