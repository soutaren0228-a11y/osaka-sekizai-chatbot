/**
 * 「答えられなかった質問」の記録（フェーズ1では簡易版）。
 *
 * このフェーズでは一覧画面は作らないが、将来のフェーズ2で
 * そのまま読み出せるように localStorage に蓄積しておく。
 */
const STORAGE_KEY = "osaka-sekizai:unanswered:v1";

interface UnansweredEntry {
  question: string;
  count: number;
  lastAskedAt: string;
  fromTest: boolean;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export async function recordUnansweredQuestion(
  question: string,
  fromTest: boolean
): Promise<void> {
  if (!isBrowser()) return;
  const trimmed = question.trim();
  if (!trimmed) return;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const entries: UnansweredEntry[] = raw ? JSON.parse(raw) : [];
  const existing = entries.find((e) => e.question === trimmed);
  if (existing) {
    existing.count += 1;
    existing.lastAskedAt = new Date().toISOString();
    existing.fromTest = existing.fromTest && fromTest;
  } else {
    entries.push({
      question: trimmed,
      count: 1,
      lastAskedAt: new Date().toISOString(),
      fromTest,
    });
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
