/**
 * 「未公開の変更」のデータ取得層（本実装）。
 * 実際のログはSupabaseの draft_changes テーブルにある
 * （`src/lib/data/server/draftChanges.ts` の recordDraftChangeServer が書き込む）。
 * ここでは一覧取得用の薄いラッパーのみを提供する。
 */
export interface DraftChange {
  id: string;
  summary: string;
  occurredAt: string;
}

export async function getDraftChanges(): Promise<DraftChange[]> {
  const res = await fetch("/api/admin/publish/pending");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "取得に失敗しました");
  return json.changes as DraftChange[];
}
