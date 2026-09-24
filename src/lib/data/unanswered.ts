/**
 * 「答えられなかった質問」のデータ取得層（フェーズ2）。
 *
 * 同じ質問文（前後の空白・大文字小文字を無視）はまとめて回数をカウントする。
 * この一覧は公開/下書きの対象ではなく、社内の運用メモとして常に最新の状態を持つ。
 */
import { createId } from "@/lib/utils/id";
import { compareDesc } from "@/lib/utils/sort";

export interface UnansweredEntry {
  id: string;
  question: string;
  count: number;
  lastAskedAt: string;
  /** これまでの発生がすべてテスト画面からのものか */
  testOnly: boolean;
  status: "open" | "dismissed";
}

const STORAGE_KEY = "osaka-sekizai:unanswered:v2";
const CHANGE_EVENT = "osaka-sekizai:unanswered-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalize(question: string): string {
  return question.trim().replace(/\s+/g, "");
}

function readAll(): UnansweredEntry[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UnansweredEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: UnansweredEntry[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeUnanswered(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function recordUnansweredQuestion(
  question: string,
  fromTest: boolean
): Promise<void> {
  const trimmed = question.trim();
  if (!trimmed) return;

  const entries = readAll();
  const key = normalize(trimmed);
  const existing = entries.find((e) => normalize(e.question) === key);

  if (existing) {
    existing.count += 1;
    existing.lastAskedAt = new Date().toISOString();
    existing.testOnly = existing.testOnly && fromTest;
  } else {
    entries.push({
      id: createId("unanswered"),
      question: trimmed,
      count: 1,
      lastAskedAt: new Date().toISOString(),
      testOnly: fromTest,
      status: "open",
    });
  }
  writeAll(entries);
}

export async function getUnansweredQuestions(): Promise<UnansweredEntry[]> {
  return [...readAll()]
    .filter((e) => e.status === "open")
    .sort((a, b) => compareDesc(a.lastAskedAt, b.lastAskedAt));
}

export async function getOpenUnansweredCount(): Promise<number> {
  return readAll().filter((e) => e.status === "open").length;
}

export async function dismissUnanswered(id: string): Promise<void> {
  writeAll(
    readAll().map((e) => (e.id === id ? { ...e, status: "dismissed" } : e))
  );
}

export async function reopenUnanswered(id: string): Promise<void> {
  writeAll(readAll().map((e) => (e.id === id ? { ...e, status: "open" } : e)));
}

export async function removeUnanswered(id: string): Promise<void> {
  writeAll(readAll().filter((e) => e.id !== id));
}
