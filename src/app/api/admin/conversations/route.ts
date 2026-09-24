import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import type { ConversationRecord } from "@/lib/data/conversations";

export async function GET(request: NextRequest) {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const isTest = request.nextUrl.searchParams.get("isTest") === "true";
  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, is_test, started_at, updated_at, messages(id, role, content, at)")
    .eq("bot_id", botId)
    .eq("is_test", isTest)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const conversations: ConversationRecord[] = data.map((row) => ({
    id: row.id,
    isTest: row.is_test,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    messages: (row.messages as { id: string; role: string; content: string; at: string }[])
      .sort((a, b) => (a.at < b.at ? -1 : 1))
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        at: m.at,
      })),
  }));

  return NextResponse.json({ conversations });
}
