/**
 * 「公開履歴」のデータ取得層（本実装）。実データはSupabaseの bot_versions テーブル。
 */
export interface PublishVersion {
  id: string;
  publishedAt: string;
  publishedBy: string;
  changeSummaries: string[];
}

export async function getPublishHistory(): Promise<PublishVersion[]> {
  const res = await fetch("/api/admin/publish/history");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "取得に失敗しました");
  return json.versions as PublishVersion[];
}
