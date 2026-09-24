import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { recordDraftChangeServer } from "@/lib/data/server/draftChanges";
import type { AppearanceSettings } from "@/lib/data/appearance";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("bots")
    .select("draft_appearance")
    .eq("id", botId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appearance: data.draft_appearance as AppearanceSettings });
}

export async function PUT(request: NextRequest) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const appearance = (await request.json()) as AppearanceSettings;
  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { error } = await supabase
    .from("bots")
    .update({ draft_appearance: appearance, updated_at: new Date().toISOString() })
    .eq("id", botId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordDraftChangeServer(botId, "見た目を更新しました");

  return NextResponse.json({ ok: true });
}
