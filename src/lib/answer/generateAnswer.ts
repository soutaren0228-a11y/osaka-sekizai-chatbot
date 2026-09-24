/**
 * 回答生成層（フェーズ2・ダミー実装）。
 *
 * 今は「登録されたFAQとの簡易一致」だけで回答を作るダミー実装。
 * 将来 Claude API + RAG検索に差し替えるときも、呼び出し側は
 * generateAnswer() / streamAnswer() のインターフェースだけに依存すればよいように、
 * 検索・回答生成のロジックはすべてこのファイルに閉じ込めている。
 *
 * isTest=true（テスト画面）のときは下書きのFAQ・話し方ルールを、
 * isTest=false（お客さま向けチャット）のときは公開版を参照する。
 */
import { getDraftFaqs, getPublishedFaqs, type FaqRecord } from "@/lib/data/faqs";
import {
  getDraftPersona,
  getPublishedPersona,
  type BannedTopic,
  type PersonaSettings,
  type ToneKey,
} from "@/lib/data/persona";
import { getUsageSettings, isOverLimit } from "@/lib/data/usage";

export interface AnswerContact {
  phone: string;
  phoneHref: string;
  contactUrl: string;
}

export interface AnswerResult {
  answer: string;
  matchedFaqId?: string;
  /** AIが「登録情報からは答えられなかった」と判定したかどうか */
  unanswered: boolean;
  /** 「答えさせない話題」に該当したため、意図的に回答しなかったかどうか */
  refused?: boolean;
  /** unanswered または refused のとき、案内先の表示に使う */
  contact?: AnswerContact;
  /** 利用上限に達しているため、案内文だけを返したかどうか */
  unavailable?: boolean;
}

const FALLBACK_TEMPLATES: Record<ToneKey, string> = {
  polite:
    "恐れ入りますが、登録されている情報の中からはお答えできませんでした。お手数ですが、下記までお問い合わせください。",
  friendly:
    "ごめんなさい、その内容はまだ登録されていないみたいです。よければ下記からお問い合わせくださいね。",
  concise: "登録情報にはありません。下記へお問い合わせください。",
};

const REFUSAL_TEMPLATES: Record<ToneKey, (topic: string) => string> = {
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

function toBigrams(text: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    bigrams.push(text.slice(i, i + 2));
  }
  return bigrams;
}

function scoreFaq(question: string, faq: FaqRecord): number {
  const nq = normalize(question);
  const nf = normalize(faq.question);
  if (!nq || !nf) return 0;

  let score = 0;
  if (nq.includes(nf) || nf.includes(nq)) score += 3;

  const bigramsF = toBigrams(nf);
  const shared = toBigrams(nq).filter((b) => bigramsF.includes(b));
  score += shared.length;

  return score;
}

function matchBannedTopic(
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

function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

function buildContact(persona: PersonaSettings): AnswerContact {
  return {
    phone: persona.contactPhone,
    phoneHref: toTelHref(persona.contactPhone),
    contactUrl: persona.contactUrl,
  };
}

function appendContact(message: string, contact: AnswerContact): string {
  return `${message}\n\n・お電話：${contact.phone}\n・お問い合わせページ：${contact.contactUrl}`;
}

async function loadContext(isTest: boolean) {
  const [faqs, persona] = await Promise.all([
    isTest ? getDraftFaqs() : getPublishedFaqs(),
    isTest ? getDraftPersona() : getPublishedPersona(),
  ]);
  return { faqs, persona };
}

/**
 * 質問文に対してダミーFAQ一致で回答を生成する。
 * 将来、この関数の中身を Claude API 呼び出しに差し替える。
 */
export async function generateAnswer(
  question: string,
  options: { isTest: boolean }
): Promise<AnswerResult> {
  const usage = await getUsageSettings();
  if (isOverLimit(usage)) {
    return { answer: usage.unavailableMessage, unanswered: false, unavailable: true };
  }

  const trimmed = question.trim();
  const { faqs, persona } = await loadContext(options.isTest);
  const contact = buildContact(persona);

  if (trimmed.length === 0) {
    return {
      answer: appendContact(FALLBACK_TEMPLATES[persona.tone], contact),
      unanswered: true,
      contact,
    };
  }

  const bannedTopic = matchBannedTopic(trimmed, persona.bannedTopics);
  if (bannedTopic) {
    return {
      answer: appendContact(
        REFUSAL_TEMPLATES[persona.tone](bannedTopic.label),
        contact
      ),
      unanswered: false,
      refused: true,
      contact,
    };
  }

  const usableFaqs = faqs.filter((f) => f.answer.trim().length > 0);
  const best = usableFaqs
    .map((faq) => ({ faq, score: scoreFaq(trimmed, faq) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score < 2) {
    return {
      answer: appendContact(FALLBACK_TEMPLATES[persona.tone], contact),
      unanswered: true,
      contact,
    };
  }

  return {
    answer: best.faq.answer,
    matchedFaqId: best.faq.id,
    unanswered: false,
  };
}

/**
 * お客さま向けチャットのストリーミング表示を再現するためのダミー実装。
 * 実際のAPIに差し替えるときは、Claude APIのストリーミングレスポンスを
 * そのままこの関数のインターフェース（AsyncGenerator<string>）に合わせて返せばよい。
 */
export async function* streamAnswer(
  question: string,
  options: { isTest: boolean }
): AsyncGenerator<string, AnswerResult> {
  const result = await generateAnswer(question, options);
  const chunkSize = 6;
  for (let i = 0; i < result.answer.length; i += chunkSize) {
    await wait(30);
    yield result.answer.slice(i, i + chunkSize);
  }
  return result;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
