import "server-only";
import { getSupabaseAuthServerClient } from "@/lib/supabase/authServer";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/data/members";

export interface CurrentMember {
  email: string;
  role: MemberRole;
}

/**
 * 今ログインしている人を取得し、membersテーブルでの権限を突き合わせる。
 * ログインしていない、またはメンバーとして招待されていない場合はnull。
 */
export async function getCurrentMember(): Promise<CurrentMember | null> {
  const authClient = await getSupabaseAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user?.email) return null;

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data } = await supabase
    .from("members")
    .select("email, role")
    .eq("bot_id", botId)
    .eq("email", user.email)
    .maybeSingle();

  if (!data) return null;
  return { email: data.email, role: data.role as MemberRole };
}

/** 管理API共通の認可チェック。編集操作が必要な場合はrequireEditor=trueで呼ぶ */
export async function requireMember(options?: {
  requireEditor?: boolean;
}): Promise<
  | { ok: true; member: CurrentMember }
  | { ok: false; status: 401 | 403 }
> {
  const member = await getCurrentMember();
  if (!member) return { ok: false, status: 401 };
  if (options?.requireEditor && member.role !== "editor") {
    return { ok: false, status: 403 };
  }
  return { ok: true, member };
}
