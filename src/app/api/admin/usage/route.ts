import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { currentYearMonth } from "@/lib/data/server/usageServer";
import type { UsageSettings } from "@/lib/data/usage";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const [{ data: settings }, { data: total }] = await Promise.all([
    supabase
      .from("usage_settings")
      .select("monthly_limit_yen, notify_email, unavailable_message, force_unavailable")
      .eq("bot_id", botId)
      .single(),
    supabase
      .from("usage_totals")
      .select("estimated_cost_yen")
      .eq("bot_id", botId)
      .eq("year_month", currentYearMonth())
      .maybeSingle(),
  ]);

  const usage: UsageSettings = {
    monthlyLimitYen: settings?.monthly_limit_yen ?? 50000,
    currentUsageYen: total?.estimated_cost_yen ?? 0,
    notifyEmail: settings?.notify_email ?? "",
    unavailableMessage: settings?.unavailable_message ?? "",
    forceUnavailable: settings?.force_unavailable ?? false,
  };

  return NextResponse.json({ usage });
}

export async function PUT(request: NextRequest) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const body = (await request.json()) as UsageSettings;
  const supabase = getSupabaseServerClient();
  const botId = await getBotId();

  const { error } = await supabase.from("usage_settings").upsert({
    bot_id: botId,
    monthly_limit_yen: body.monthlyLimitYen,
    notify_email: body.notifyEmail,
    unavailable_message: body.unavailableMessage,
    force_unavailable: body.forceUnavailable,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
