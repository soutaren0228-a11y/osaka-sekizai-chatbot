/**
 * 「話し方・ルール」のデータ取得層（フェーズ2・ダミー実装）。
 * 下書き（テスト画面が参照）と公開版（お客さま向けチャットが参照）を分けて保持する。
 */
import { createId } from "@/lib/utils/id";
import { recordDraftChange } from "./publishState";

export type ToneKey = "polite" | "friendly" | "concise";

export interface BannedTopic {
  id: string;
  label: string;
  enabled: boolean;
  isPreset: boolean;
}

export interface PersonaSettings {
  tone: ToneKey;
  bannedTopics: BannedTopic[];
  contactPhone: string;
  contactUrl: string;
}

export const TONE_OPTIONS: { key: ToneKey; label: string; example: string }[] = [
  {
    key: "polite",
    label: "丁寧",
    example:
      "恐れ入りますが、登録されている情報の中からはお答えできませんでした。お手数ですが、下記までお問い合わせください。",
  },
  {
    key: "friendly",
    label: "親しみやすい",
    example:
      "ごめんなさい、その内容はまだ登録されていないみたいです。よければ下記からお問い合わせくださいね。",
  },
  {
    key: "concise",
    label: "簡潔",
    example: "登録情報にはありません。下記へお問い合わせください。",
  },
];

const PRESET_TOPIC_LABELS = [
  "他社との比較",
  "値引きの交渉",
  "宗派・しきたりの断定",
  "採用・求人について",
];

const DRAFT_KEY = "osaka-sekizai:persona:draft:v1";
const PUBLISHED_KEY = "osaka-sekizai:persona:published:v1";
const CHANGE_EVENT = "osaka-sekizai:persona-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function defaultSettings(): PersonaSettings {
  return {
    tone: "polite",
    bannedTopics: PRESET_TOPIC_LABELS.map((label) => ({
      id: createId("topic"),
      label,
      enabled: true,
      isPreset: true,
    })),
    contactPhone: "0120-1114-90",
    contactUrl: "https://www.osaka-sekizai.jp/contact/",
  };
}

function readKey(key: string): PersonaSettings {
  if (!isBrowser()) return defaultSettings();
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const seeded = defaultSettings();
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as PersonaSettings;
  } catch {
    return defaultSettings();
  }
}

function writeDraft(settings: PersonaSettings) {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribePersona(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function getDraftPersona(): Promise<PersonaSettings> {
  return readKey(DRAFT_KEY);
}

export async function getPublishedPersona(): Promise<PersonaSettings> {
  return readKey(PUBLISHED_KEY);
}

export async function saveDraftPersona(settings: PersonaSettings): Promise<void> {
  writeDraft(settings);
  recordDraftChange("話し方・ルールを更新しました");
}

export async function publishPersonaDraft(): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(PUBLISHED_KEY, JSON.stringify(readKey(DRAFT_KEY)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** 過去の版に戻す：下書き・公開版の両方を指定の内容で上書きする */
export async function restorePersonaSnapshot(settings: PersonaSettings): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
  window.localStorage.setItem(PUBLISHED_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}
