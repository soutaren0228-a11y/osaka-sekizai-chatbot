/**
 * 「会話ログ」のデータ取得層（フェーズ3）。
 * お客さま向けチャットとテスト画面の会話を、それぞれ別のものとして保存する。
 * 実際にお客さまから質問が来た時点（最初の発言）から記録を始める
 * （あいさつだけで終わった訪問を大量に記録しないため）。
 */
import { createId } from "@/lib/utils/id";
import { compareDesc } from "@/lib/utils/sort";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface ConversationRecord {
  id: string;
  isTest: boolean;
  startedAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

const STORAGE_KEY = "osaka-sekizai:conversations:v1";
const RETENTION_KEY = "osaka-sekizai:conversation-retention-days:v1";
const CHANGE_EVENT = "osaka-sekizai:conversations-changed";
const DEFAULT_RETENTION_DAYS = 90;

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): ConversationRecord[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ConversationRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: ConversationRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeConversations(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** 会話を開始する（あいさつ＋最初のお客さまの発言をまとめて記録する） */
export async function startConversation(
  id: string,
  isTest: boolean,
  greeting: string,
  firstUserMessage: string
): Promise<void> {
  const now = new Date().toISOString();
  const record: ConversationRecord = {
    id,
    isTest,
    startedAt: now,
    updatedAt: now,
    messages: [
      { id: createId("cmsg"), role: "assistant", content: greeting, at: now },
      { id: createId("cmsg"), role: "user", content: firstUserMessage, at: now },
    ],
  };
  writeAll([record, ...readAll()]);
}

export async function appendConversationMessage(
  id: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const all = readAll();
  const record = all.find((r) => r.id === id);
  if (!record) return;
  const now = new Date().toISOString();
  record.messages.push({ id: createId("cmsg"), role, content, at: now });
  record.updatedAt = now;
  writeAll(all);
}

export async function getConversations(options: {
  isTest: boolean;
}): Promise<ConversationRecord[]> {
  return readAll()
    .filter((r) => r.isTest === options.isTest)
    .sort((a, b) => compareDesc(a.updatedAt, b.updatedAt));
}

export async function getConversationRetentionDays(): Promise<number> {
  if (!isBrowser()) return DEFAULT_RETENTION_DAYS;
  const raw = window.localStorage.getItem(RETENTION_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RETENTION_DAYS;
}

export async function setConversationRetentionDays(days: number): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(RETENTION_KEY, String(days));
}
