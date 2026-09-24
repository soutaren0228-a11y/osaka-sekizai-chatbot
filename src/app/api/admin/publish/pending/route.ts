import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import type { DraftChange } from "@/lib/data/publishState";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("draft_changes")
    .select("id, summary, occurred_at")
    .eq("bot_id", botId)
    .order("occurred_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const changes: DraftChange[] = data.map((row) => ({
    id: row.id,
    summary: row.summary,
    occurredAt: row.occurred_at,
  }));
  return NextResponse.json({ changes });
}
