/**
 * 「未公開の変更」の件数・内容を記録する層。
 *
 * よくある質問・話し方や案内先・見た目の下書きを編集するたびに
 * recordDraftChange() を呼んで変更点を1件ずつ記録する。
 * 「公開する」を押すと ./publish.ts の publishAll() がここをクリアする。
 *
 * 「AIに覚えさせる情報」は今回の試作ではダミー回答生成に使われず、
 * お客さまから見える結果に影響しないため、この下書き/公開の対象外としている
 * （CLAUDE.md参照）。
 */
import { compareDesc } from "@/lib/utils/sort";

const KEY = "osaka-sekizai:draft-changes:v1";
const LAST_PUBLISHED_KEY = "osaka-sekizai:last-published-at:v1";
const EVENT = "osaka-sekizai:draft-changes-changed";

export interface DraftChange {
  id: string;
  summary: string;
  occurredAt: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): DraftChange[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DraftChange[];
  } catch {
    return [];
  }
}

function writeAll(changes: DraftChange[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(changes));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeDraftChanges(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function getDraftChanges(): Promise<DraftChange[]> {
  return [...readAll()].sort((a, b) => compareDesc(a.occurredAt, b.occurredAt));
}

/** 変更を1件記録する（画面の保存・追加・削除操作から呼び出す） */
export function recordDraftChange(summary: string): void {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  writeAll([
    { id, summary, occurredAt: new Date().toISOString() },
    ...readAll(),
  ]);
}

export async function clearDraftChanges(): Promise<void> {
  writeAll([]);
}

export async function getLastPublishedAt(): Promise<string | null> {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(LAST_PUBLISHED_KEY);
}

export function setLastPublishedAt(iso: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(LAST_PUBLISHED_KEY, iso);
}
