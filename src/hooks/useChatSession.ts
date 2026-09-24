"use client";

import { useCallback, useState } from "react";
import { streamAnswer } from "@/lib/answer/generateAnswer";
import { recordUnansweredQuestion } from "@/lib/data/unanswered";
import { createId } from "@/lib/utils/id";
import type { ChatMessage } from "@/components/chat/types";

export function useChatSession(options: { isTest: boolean; greeting: string }) {
  const initial: ChatMessage[] = [
    { id: createId("msg"), role: "assistant", content: options.greeting },
  ];
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [isSending, setIsSending] = useState(false);

  const reset = useCallback(() => {
    setMessages([{ id: createId("msg"), role: "assistant", content: options.greeting }]);
  }, [options.greeting]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMessage: ChatMessage = {
        id: createId("msg"),
        role: "user",
        content: trimmed,
      };
      const assistantId = createId("msg");
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setIsSending(true);

      let full = "";
      let unanswered = false;
      const generator = streamAnswer(trimmed);
      let next = await generator.next();
      while (!next.done) {
        full += next.value;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
        );
        next = await generator.next();
      }
      unanswered = next.value.unanswered;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, streaming: false, unanswered } : m
        )
      );
      setIsSending(false);

      if (unanswered) {
        await recordUnansweredQuestion(trimmed, options.isTest);
      }
    },
    [isSending, options.isTest]
  );

  return { messages, isSending, sendMessage, reset };
}
