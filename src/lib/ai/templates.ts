/**
 * 「答えさせない話題」の高速判定と、案内文の定型テンプレート。
 * Claude呼び出し前にここで弾ける場合はAPIコストを節約する
 * （すり抜けた場合の二次防波堤はシステムプロンプト側にもある。anthropic.ts参照）。
 */
import type { BannedTopic, PersonaSettings, ToneKey } from "@/lib/data/persona";

export interface AnswerContact {
  phone: string;
  phoneHref: string;
  contactUrl: string;
}

export const FALLBACK_TEMPLATES: Record<ToneKey, string> = {
  polite:
    "恐れ入りますが、登録されている情報の中からはお答えできませんでした。お手数ですが、下記までお問い合わせください。",
  friendly:
    "ごめんなさい、その内容はまだ登録されていないみたいです。よければ下記からお問い合わせくださいね。",
  concise: "登録情報にはありません。下記へお問い合わせください。",
};

export const REFUSAL_TEMPLATES: Record<ToneKey, (topic: string) => string> = {
  polite: (topic) =>
    `恐れ入りますが、${topic}に関するご質問にはお答えしかねます。お手数ですが、下記までお問い合わせください。`,
  friendly: (topic) =>
    `ごめんなさい、${topic}についてはこちらではお答えできないんです。下記からお問い合わせくださいね。`,
  concise: (topic) => `${topic}には回答できません。下記へお問い合わせください。`,
};

const PRESET_TOPIC_HINTS: Record<string, string[]> = {
  他社との比較: ["他社", "比較", "よそ", "どちらが", "どっちが"],
  値引きの交渉: ["値引き", "安く", "まけて", "割引", "負けて"],
  "宗派・しきたりの断定": ["宗派", "しきたり", "作法", "戒律"],
  "採用・求人について": ["採用", "求人", "アルバイト", "正社員", "転職", "働きたい"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s　、。！？!?.,・]/g, "")
    .trim();
}

export function matchBannedTopic(
  question: string,
  topics: BannedTopic[]
): BannedTopic | undefined {
  const nq = normalize(question);
  return topics.find((topic) => {
    if (!topic.enabled) return false;
    const hints = PRESET_TOPIC_HINTS[topic.label] ?? [topic.label];
    return hints.some((hint) => nq.includes(normalize(hint)));
  });
}

export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

export function buildContact(persona: PersonaSettings): AnswerContact {
  return {
    phone: persona.contactPhone,
    phoneHref: toTelHref(persona.contactPhone),
    contactUrl: persona.contactUrl,
  };
}

export function appendContact(message: string, contact: AnswerContact): string {
  return `${message}\n\n・お電話：${contact.phone}\n・お問い合わせページ：${contact.contactUrl}`;
}
