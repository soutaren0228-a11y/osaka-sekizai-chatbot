/**
 * 「よくある質問」のデータ取得層（本実装）。
 *
 * ここでの関数はブラウザから呼ばれる薄いラッパー（`/api/admin/faqs`系を叩くだけ）。
 * 実際のSupabaseクエリ・埋め込み計算は該当するRoute Handlerにある。
 * `FaqRow` / `mapFaqRow` / `truncateForLog` はRoute Handler側でも使う純粋関数のため、
 * サーバー専用の依存を持たずここに置いている（server-onlyは付けない）。
 */
export interface FaqRecord {
  id: string;
  /** お客さまの質問 */
  question: string;
  /** AIに答えてほしい内容 */
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export function mapFaqRow(row: FaqRow): FaqRecord {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function truncateForLog(text: string): string {
  return text.length > 20 ? `${text.slice(0, 20)}…` : text;
}

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getDraftFaqs(): Promise<FaqRecord[]> {
  const res = await fetch("/api/admin/faqs");
  const json = await parseJsonOrThrow(res);
  return json.faqs as FaqRecord[];
}

export async function addFaq(input: {
  question: string;
  answer: string;
}): Promise<FaqRecord> {
  const res = await fetch("/api/admin/faqs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await parseJsonOrThrow(res);
  return json.faq as FaqRecord;
}

export async function updateFaq(
  id: string,
  input: { question: string; answer: string }
): Promise<void> {
  const res = await fetch(`/api/admin/faqs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await parseJsonOrThrow(res);
}

export async function deleteFaq(id: string): Promise<void> {
  const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res);
}

/** 削除の「元に戻す」：同じ内容で作り直す（埋め込みは再計算される） */
export async function restoreFaq(record: FaqRecord): Promise<void> {
  await addFaq({ question: record.question, answer: record.answer });
}
