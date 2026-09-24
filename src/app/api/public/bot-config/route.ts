import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { isOriginAllowed, corsHeaders } from "@/lib/security/allowedOrigins";
import type { AppearanceSettings } from "@/lib/data/appearance";

/**
 * 埋め込みウィジェット・お客さま向けチャット用の公開設定。
 * 認証は不要だが、許可ドメイン以外からのアクセスは拒否する
 * （Originヘッダーが無い場合は同一オリジンからの利用とみなして許可する）。
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return NextResponse.json({ error: "このドメインからは利用できません" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { data: bot, error } = await supabase
    .from("bots")
    .select("current_published_version_id")
    .eq("id", botId)
    .single();

  if (error || !bot?.current_published_version_id) {
    return NextResponse.json(
      { error: "まだ公開されていません" },
      { status: 404, headers: origin ? corsHeaders(origin) : undefined }
    );
  }

  const { data: version } = await supabase
    .from("bot_versions")
    .select("snapshot")
    .eq("id", bot.current_published_version_id)
    .single();

  const appearance = version?.snapshot?.appearance as AppearanceSettings | undefined;
  if (!appearance) {
    return NextResponse.json({ error: "設定を取得できませんでした" }, { status: 500 });
  }

  return NextResponse.json(
    { appearance },
    { headers: origin ? corsHeaders(origin) : undefined }
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { headers: origin ? corsHeaders(origin) : undefined });
}
