import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import type { PublishVersion } from "@/lib/data/publishHistory";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("bot_versions")
    .select("id, published_at, published_by, change_summaries")
    .eq("bot_id", botId)
    .order("published_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const versions: PublishVersion[] = data.map((row) => ({
    id: row.id,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
    changeSummaries: row.change_summaries as string[],
  }));
  return NextResponse.json({ versions });
}
