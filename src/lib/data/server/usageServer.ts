import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { estimateCostYen } from "@/lib/ai/pricing";

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export interface UsageCheckResult {
  unavailable: boolean;
  message: string;
}

/** 利用上限に達しているか（テスト用の強制切り替えを含む）を判定する */
export async function checkUsageLimit(botId: string): Promise<UsageCheckResult> {
  const supabase = getSupabaseServerClient();
  const [{ data: settings }, { data: total }] = await Promise.all([
    supabase
      .from("usage_settings")
      .select("monthly_limit_yen, unavailable_message, force_unavailable")
      .eq("bot_id", botId)
      .single(),
    supabase
      .from("usage_totals")
      .select("estimated_cost_yen")
      .eq("bot_id", botId)
      .eq("year_month", currentYearMonth())
      .maybeSingle(),
  ]);

  const message =
    settings?.unavailable_message ||
    "現在ご利用いただけません。しばらく経ってから改めてお試しください。";

  if (settings?.force_unavailable) {
    return { unavailable: true, message };
  }

  const currentCost = total?.estimated_cost_yen ?? 0;
  const limit = settings?.monthly_limit_yen ?? 50000;
  if (currentCost >= limit) {
    return { unavailable: true, message };
  }

  return { unavailable: false, message };
}

/** 実際に使ったトークン数を今月の利用状況に加算する */
export async function recordUsage(
  botId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const yearMonth = currentYearMonth();
  const costYen = estimateCostYen(inputTokens, outputTokens);

  const { data: existing } = await supabase
    .from("usage_totals")
    .select("input_tokens, output_tokens, estimated_cost_yen")
    .eq("bot_id", botId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  await supabase.from("usage_totals").upsert({
    bot_id: botId,
    year_month: yearMonth,
    input_tokens: (existing?.input_tokens ?? 0) + inputTokens,
    output_tokens: (existing?.output_tokens ?? 0) + outputTokens,
    estimated_cost_yen: (existing?.estimated_cost_yen ?? 0) + costYen,
  });
}
