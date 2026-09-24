/**
 * 「よくある質問」のデータ取得層（フェーズ2・ダミー実装）。
 *
 * 管理画面での追加・編集・削除は下書き（draft）に対してのみ行う。
 * 「公開する」を押すまでは、お客さま向けチャット（widget-demo）には反映されない。
 * 管理画面右の「テスト画面」は常に下書きを見る。
 *
 * 将来Supabase等に差し替えるときも、getDraftFaqs / getPublishedFaqs /
 * addFaq / updateFaq / deleteFaq のシグネチャは変えずに中身だけ差し替える想定。
 */
import { createId } from "@/lib/utils/id";
import { compareDesc } from "@/lib/utils/sort";
import { recordDraftChange } from "./publishState";

export interface FaqRecord {
  id: string;
  /** お客さまの質問 */
  question: string;
  /** AIに答えてほしい内容 */
  answer: string;
  createdAt: string;
  updatedAt: string;
}

const DRAFT_KEY = "osaka-sekizai:faqs:draft:v1";
const PUBLISHED_KEY = "osaka-sekizai:faqs:published:v1";
const CHANGE_EVENT = "osaka-sekizai:faqs-changed";

/** 初期データ（回答は担当者が入力するため、はじめは空欄） */
const SEED_QUESTIONS = [
  "お墓じまいの金額・相場は？",
  "お墓じまいの流れは？",
  "戒名彫刻の費用は？",
  "戒名彫刻の流れは？",
  "お墓じまい後の自宅用モニュメント制作",
];

function isBrowser() {
  return typeof window !== "undefined";
}

function now() {
  return new Date().toISOString();
}

function seedFaqs(): FaqRecord[] {
  const t = now();
  return SEED_QUESTIONS.map((question) => ({
    id: createId("faq"),
    question,
    answer: "",
    createdAt: t,
    updatedAt: t,
  }));
}

function readKey(key: string): FaqRecord[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const seeded = seedFaqs();
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as FaqRecord[];
  } catch {
    return [];
  }
}

function writeDraft(records: FaqRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeFaqs(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function getDraftFaqs(): Promise<FaqRecord[]> {
  return [...readKey(DRAFT_KEY)].sort((a, b) => compareDesc(a.createdAt, b.createdAt));
}

export async function getPublishedFaqs(): Promise<FaqRecord[]> {
  return [...readKey(PUBLISHED_KEY)].sort((a, b) => compareDesc(a.createdAt, b.createdAt));
}

export async function addFaq(input: {
  question: string;
  answer: string;
}): Promise<FaqRecord> {
  const record: FaqRecord = {
    id: createId("faq"),
    question: input.question,
    answer: input.answer,
    createdAt: now(),
    updatedAt: now(),
  };
  writeDraft([record, ...readKey(DRAFT_KEY)]);
  recordDraftChange(`「${truncate(input.question)}」を追加しました`);
  return record;
}

export async function updateFaq(
  id: string,
  input: { question: string; answer: string }
): Promise<void> {
  const all = readKey(DRAFT_KEY);
  const next = all.map((f) =>
    f.id === id
      ? { ...f, question: input.question, answer: input.answer, updatedAt: now() }
      : f
  );
  writeDraft(next);
  recordDraftChange(`「${truncate(input.question)}」を更新しました`);
}

export async function deleteFaq(id: string): Promise<void> {
  const all = readKey(DRAFT_KEY);
  const target = all.find((f) => f.id === id);
  writeDraft(all.filter((f) => f.id !== id));
  if (target) {
    recordDraftChange(`「${truncate(target.question)}」を削除しました`);
  }
}

export async function restoreFaq(record: FaqRecord): Promise<void> {
  writeDraft([record, ...readKey(DRAFT_KEY).filter((f) => f.id !== record.id)]);
  recordDraftChange(`「${truncate(record.question)}」を元に戻しました`);
}

/** 公開する：今の下書きをそのまま公開版としてコピーする */
export async function publishFaqsDraft(): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(PUBLISHED_KEY, JSON.stringify(readKey(DRAFT_KEY)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** 過去の版に戻す：下書き・公開版の両方を指定の内容で上書きする */
export async function restoreFaqsSnapshot(records: FaqRecord[]): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(records));
  window.localStorage.setItem(PUBLISHED_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function truncate(text: string): string {
  return text.length > 20 ? `${text.slice(0, 20)}…` : text;
}
