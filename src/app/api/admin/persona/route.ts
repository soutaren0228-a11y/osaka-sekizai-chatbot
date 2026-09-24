import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { recordDraftChangeServer } from "@/lib/data/server/draftChanges";
import type { PersonaSettings } from "@/lib/data/persona";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("bots")
    .select("draft_persona")
    .eq("id", botId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ persona: data.draft_persona as PersonaSettings });
}

export async function PUT(request: NextRequest) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const persona = (await request.json()) as PersonaSettings;
  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { error } = await supabase
    .from("bots")
    .update({ draft_persona: persona, updated_at: new Date().toISOString() })
    .eq("id", botId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordDraftChangeServer(botId, "話し方・ルールを更新しました");

  return NextResponse.json({ ok: true });
}
