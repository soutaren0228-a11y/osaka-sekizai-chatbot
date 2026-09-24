import type { AnswerContact } from "./templates";

/**
 * /api/chat のストリーミング応答の形式（改行区切りJSON = NDJSON）。
 * SSEではなく単純な改行区切りにしているのは、自前のfetchストリーム読み取りだけで
 * 完結させ、クライアント側の実装を最小限にするため。
 */
export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "done";
      status: "answered" | "unanswered" | "refused" | "unavailable";
      contact?: AnswerContact;
    }
  | { type: "error"; message: string };

export function encodeEvent(event: ChatStreamEvent): string {
  return JSON.stringify(event) + "\n";
}
