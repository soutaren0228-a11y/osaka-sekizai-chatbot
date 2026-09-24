import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import type { MemberRecord, MemberRole } from "@/lib/data/members";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("members")
    .select("id, email, role, invited_at, is_owner")
    .eq("bot_id", botId)
    .order("invited_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const members: MemberRecord[] = data.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as MemberRole,
    invitedAt: row.invited_at,
    isOwner: row.is_owner,
  }));
  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const body = (await request.json()) as { email?: string; role?: MemberRole };
  const email = (body.email ?? "").trim();
  const role: MemberRole = body.role === "viewer" ? "viewer" : "editor";
  if (!email) return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  // すでにSupabase Authに登録済みのユーザーは「already registered」系のエラーになる。
  // その場合はログイン自体は既にできる状態なので、membersへの追加だけ続行する。
  if (inviteError && !/already/i.test(inviteError.message)) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("members")
    .upsert(
      { bot_id: botId, email, role, is_owner: false },
      { onConflict: "bot_id,email" }
    )
    .select("id, email, role, invited_at, is_owner")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const member: MemberRecord = {
    id: data.id,
    email: data.email,
    role: data.role as MemberRole,
    invitedAt: data.invited_at,
    isOwner: data.is_owner,
  };
  return NextResponse.json({ member });
}
