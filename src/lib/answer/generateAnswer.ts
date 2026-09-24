/**
 * 回答生成層（フェーズ1・ダミー実装）。
 *
 * 今は「登録されたFAQとの簡易一致」だけで回答を作るダミー実装。
 * 将来 Claude API + RAG検索に差し替えるときも、呼び出し側は
 * generateAnswer() / streamAnswer() のインターフェースだけに依存すればよいように、
 * 検索・回答生成のロジックはすべてこのファイルに閉じ込めている。
 */
import { dummyFaqs } from "./dummyFaq";

export const contactInfo = {
  phone: "0120-1114-90",
  phoneHref: "tel:0120111490",
  contactUrl: "https://www.osaka-sekizai.jp/contact/",
};

export interface AnswerResult {
  answer: string;
  matchedFaqId?: string;
  /** AIが「登録情報からは答えられなかった」と判定したかどうか */
  unanswered: boolean;
}

const FALLBACK_ANSWER =
  `恐れ入りますが、登録されている情報の中からはお答えできませんでした。` +
  `お手数ですが、下記までお問い合わせください。\n\n` +
  `・お電話：${contactInfo.phone}\n` +
  `・お問い合わせページ：${contactInfo.contactUrl}`;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s　、。！？!?.,]/g, "")
    .trim();
}

function scoreFaq(question: string, faq: (typeof dummyFaqs)[number]): number {
  const normalizedQuestion = normalize(question);
  if (normalizedQuestion.length === 0) return 0;

  let score = 0;
  for (const keyword of faq.keywords) {
    if (normalizedQuestion.includes(normalize(keyword))) {
      score += 1;
    }
  }
  // FAQの質問文そのものとの部分一致は特に強いシグナルとして扱う
  if (normalizedQuestion.includes(normalize(faq.question))) {
    score += 2;
  }
  return score;
}

/**
 * 質問文に対してダミーFAQ一致で回答を生成する。
 * 将来、この関数の中身を Claude API 呼び出しに差し替える。
 */
export async function generateAnswer(question: string): Promise<AnswerResult> {
  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return { answer: FALLBACK_ANSWER, unanswered: true };
  }

  const scored = dummyFaqs
    .map((faq) => ({ faq, score: scoreFaq(trimmed, faq) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score === 0) {
    return { answer: FALLBACK_ANSWER, unanswered: true };
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
  question: string
): AsyncGenerator<string, AnswerResult> {
  const result = await generateAnswer(question);
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
