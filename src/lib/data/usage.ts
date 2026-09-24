/**
 * 「利用状況」のデータ取得層（本実装）。
 * `/api/admin/usage` を経由してSupabase（usage_settings / usage_totals）を読み書きする。
 */
export interface UsageSettings {
  monthlyLimitYen: number;
  /** 今月のAPI利用額の見積もり（Anthropicのトークン数から概算） */
  currentUsageYen: number;
  notifyEmail: string;
  unavailableMessage: string;
  /** 動作確認用：上限に達した状態を強制的に試す */
  forceUnavailable: boolean;
}

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getUsageSettings(): Promise<UsageSettings> {
  const res = await fetch("/api/admin/usage");
  const json = await parseJsonOrThrow(res);
  return json.usage as UsageSettings;
}

export async function saveUsageSettings(settings: UsageSettings): Promise<void> {
  const res = await fetch("/api/admin/usage", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  await parseJsonOrThrow(res);
}

export function isOverLimit(settings: UsageSettings): boolean {
  return settings.forceUnavailable || settings.currentUsageYen >= settings.monthlyLimitYen;
}
