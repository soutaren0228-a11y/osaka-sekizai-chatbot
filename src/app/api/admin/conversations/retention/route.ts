import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("bots")
    .select("conversation_retention_days")
    .eq("id", botId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ retentionDays: data.conversation_retention_days });
}

export async function PUT(request: NextRequest) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const body = (await request.json()) as { retentionDays?: number };
  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { error } = await supabase
    .from("bots")
    .update({ conversation_retention_days: body.retentionDays })
    .eq("id", botId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
