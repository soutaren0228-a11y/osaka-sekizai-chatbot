/**
 * 「AIに覚えさせる情報」のデータ取得層（本実装）。
 *
 * ブラウザからSupabaseへ直接アクセスさせない設計のため（CLAUDE.md 13節）、
 * ここでは `/api/admin/sources` 系のRoute Handlerを呼ぶだけの薄いラッパーにしている。
 * 実際のSupabaseクエリ・取り込み処理は `src/app/api/admin/sources/` と
 * `src/lib/ai/ingest.ts` にある。
 *
 * 取り込みはサーバー側でバックグラウンド実行されるため、状態の変化（読み込み中→
 * 読み込み済み）はイベントではなくポーリングで検知する（useSources.ts参照）。
 */
import type {
  AddPdfInput,
  AddTextInput,
  AddUrlInput,
  SourceRecord,
} from "./types";

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getSources(): Promise<SourceRecord[]> {
  const res = await fetch("/api/admin/sources");
  const json = await parseJsonOrThrow(res);
  return json.sources as SourceRecord[];
}

export async function addSourceFromUrl(input: AddUrlInput): Promise<SourceRecord> {
  const form = new FormData();
  form.set("type", "url");
  form.set("url", input.url);
  const res = await fetch("/api/admin/sources", { method: "POST", body: form });
  const json = await parseJsonOrThrow(res);
  return json.source as SourceRecord;
}

export async function addSourceFromText(input: AddTextInput): Promise<SourceRecord> {
  const form = new FormData();
  form.set("type", "text");
  form.set("title", input.title);
  form.set("body", input.body);
  const res = await fetch("/api/admin/sources", { method: "POST", body: form });
  const json = await parseJsonOrThrow(res);
  return json.source as SourceRecord;
}

export async function addSourceFromPdf(input: AddPdfInput): Promise<SourceRecord> {
  const form = new FormData();
  form.set("type", "pdf");
  form.set("file", input.file);
  const res = await fetch("/api/admin/sources", { method: "POST", body: form });
  const json = await parseJsonOrThrow(res);
  return json.source as SourceRecord;
}

export async function reloadSource(id: string): Promise<void> {
  const res = await fetch(`/api/admin/sources/${id}/reload`, { method: "POST" });
  await parseJsonOrThrow(res);
}

export async function deleteSource(id: string): Promise<void> {
  const res = await fetch(`/api/admin/sources/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res);
}

export async function restoreSource(record: SourceRecord): Promise<void> {
  const res = await fetch(`/api/admin/sources/${record.id}/restore`, { method: "POST" });
  await parseJsonOrThrow(res);
}

export async function setSourceActive(id: string, active: boolean): Promise<void> {
  const res = await fetch(`/api/admin/sources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  await parseJsonOrThrow(res);
}
