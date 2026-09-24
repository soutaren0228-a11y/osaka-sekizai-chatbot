import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/data/members";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json()) as { role?: MemberRole };
  const supabase = getSupabaseServerClient();

  const { data: target } = await supabase.from("members").select("is_owner").eq("id", id).single();
  if (target?.is_owner) {
    return NextResponse.json({ error: "オーナーの権限は変更できません" }, { status: 400 });
  }

  const { error } = await supabase.from("members").update({ role: body.role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: target } = await supabase.from("members").select("is_owner").eq("id", id).single();
  if (target?.is_owner) {
    return NextResponse.json({ error: "オーナーは削除できません" }, { status: 400 });
  }

  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
