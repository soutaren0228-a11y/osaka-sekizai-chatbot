"use client";

import type { ChatStreamEvent } from "@/lib/ai/streamProtocol";
import type { AnswerContact } from "@/lib/ai/templates";

export interface StreamChatResult {
  status: "answered" | "unanswered" | "refused" | "unavailable";
  contact?: AnswerContact;
}

/**
 * /api/chat をストリーミング呼び出しするクライアント側の薄いラッパー。
 * NDJSON（改行区切りJSON）のレスポンスを読みながら、本文の断片をyieldする。
 */
export async function* streamChatMessage(
  question: string,
  options: { isTest: boolean; conversationId: string }
): AsyncGenerator<string, StreamChatResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      isTest: options.isTest,
      conversationId: options.conversationId,
    }),
  });

  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `通信に失敗しました (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: StreamChatResult = { status: "answered" };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.trim()) {
        const event = JSON.parse(line) as ChatStreamEvent;
        if (event.type === "delta") {
          yield event.text;
        } else if (event.type === "done") {
          result = { status: event.status, contact: event.contact };
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
      newlineIndex = buffer.indexOf("\n");
    }
  }

  return result;
}
