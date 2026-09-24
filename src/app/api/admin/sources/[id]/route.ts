import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { mapSourceRow } from "@/lib/data/mappers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as { active?: boolean };
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("sources")
    .update({ active: body.active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: mapSourceRow(data) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  // ソフトデリート：チャンク・埋め込み・保存済みファイルは残し、一覧からのみ隠す
  // （「元に戻す」で即座に復元できるようにするため。activeの値は変えない）。
  const { error } = await supabase
    .from("sources")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
