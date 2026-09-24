import "server-only";
import { createHash } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

/** IPごとの回数制限（1分あたり・1日あたり）。超えていなければ1件記録する */
export async function checkAndRecordRateLimit(
  botId: string,
  ipHash: string
): Promise<RateLimitResult> {
  const supabase = getSupabaseServerClient();
  const perMinuteLimit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? "10");
  const perDayLimit = Number(process.env.RATE_LIMIT_PER_DAY ?? "100");

  const now = Date.now();
  const minuteAgo = new Date(now - 60_000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: minuteCount }, { count: dayCount }] = await Promise.all([
    supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("bot_id", botId)
      .eq("ip_hash", ipHash)
      .gte("created_at", minuteAgo),
    supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("bot_id", botId)
      .eq("ip_hash", ipHash)
      .gte("created_at", dayAgo),
  ]);

  if ((minuteCount ?? 0) >= perMinuteLimit) {
    return { allowed: false, reason: "1分あたりのご利用回数の上限を超えました。しばらくしてからお試しください。" };
  }
  if ((dayCount ?? 0) >= perDayLimit) {
    return { allowed: false, reason: "本日のご利用回数の上限を超えました。明日以降に改めてお試しください。" };
  }

  await supabase.from("rate_limit_events").insert({ bot_id: botId, ip_hash: ipHash });
  return { allowed: true };
}
