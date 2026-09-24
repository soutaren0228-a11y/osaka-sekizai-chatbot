import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/lib/supabase/authServer";

/** マジックリンクのリダイレクト先。codeをセッションに交換して管理画面へ戻す */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/admin";

  if (code) {
    const supabase = await getSupabaseAuthServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
