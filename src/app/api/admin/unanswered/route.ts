import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import type { UnansweredEntry } from "@/lib/data/unanswered";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("unanswered_questions")
    .select("id, question, count, last_asked_at, test_only, status")
    .eq("bot_id", botId)
    .eq("status", "open")
    .order("last_asked_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries: UnansweredEntry[] = data.map((row) => ({
    id: row.id,
    question: row.question,
    count: row.count,
    lastAskedAt: row.last_asked_at,
    testOnly: row.test_only,
    status: row.status as "open" | "dismissed",
  }));
  return NextResponse.json({ entries });
}
