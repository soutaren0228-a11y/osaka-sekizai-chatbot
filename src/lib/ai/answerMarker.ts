/**
 * Claudeの応答の先頭行 [STATUS:ANSWERED|UNANSWERED|REFUSED] を読み取り、
 * お客さまに見せる本文からはこの1行を取り除くためのユーティリティ。
 * ストリーミングで断片的に届くテキストにも対応できるよう、状態を持つ形にしている。
 */
export type AnswerStatus = "answered" | "unanswered" | "refused";

const MARKER_PATTERN = /^\[STATUS:(ANSWERED|UNANSWERED|REFUSED)\]\r?\n?/;
const MAX_BUFFER_BEFORE_GIVING_UP = 40;

export interface MarkerStripper {
  /** ストリームの断片を渡すと、お客さまに見せてよい部分だけを返す */
  push(chunk: string): string;
  /** ストリーム終了後に呼ぶ。マーカーが検出できていれば結果を返す */
  getStatus(): AnswerStatus;
}

export function createMarkerStripper(): MarkerStripper {
  let buffer = "";
  let resolved = false;
  let status: AnswerStatus = "answered";

  function push(chunk: string): string {
    if (resolved) return chunk;

    buffer += chunk;
    const match = buffer.match(MARKER_PATTERN);
    if (match) {
      status = match[1].toLowerCase() as AnswerStatus;
      const rest = buffer.slice(match[0].length);
      resolved = true;
      buffer = "";
      return rest;
    }

    if (buffer.length > MAX_BUFFER_BEFORE_GIVING_UP) {
      // マーカーが見つからなかった（想定外の応答形式）。そのまま出力する。
      resolved = true;
      const rest = buffer;
      buffer = "";
      return rest;
    }

    return "";
  }

  function getStatus(): AnswerStatus {
    return status;
  }

  return { push, getStatus };
}
