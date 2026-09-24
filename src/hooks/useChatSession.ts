"use client";

import { useCallback, useRef, useState } from "react";
import { streamAnswer } from "@/lib/answer/generateAnswer";
import { recordUnansweredQuestion } from "@/lib/data/unanswered";
import {
  appendConversationMessage,
  startConversation,
} from "@/lib/data/conversations";
import { createId } from "@/lib/utils/id";
import type { ChatMessage } from "@/components/chat/types";

export function useChatSession(options: { isTest: boolean; greeting: string }) {
  const initial: ChatMessage[] = [
    { id: createId("msg"), role: "assistant", content: options.greeting },
  ];
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [isSending, setIsSending] = useState(false);
  const conversationIdRef = useRef(createId("conv"));
  const conversationStartedRef = useRef(false);

  const reset = useCallback(() => {
    setMessages([{ id: createId("msg"), role: "assistant", content: options.greeting }]);
    conversationIdRef.current = createId("conv");
    conversationStartedRef.current = false;
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

      if (!conversationStartedRef.current) {
        conversationStartedRef.current = true;
        await startConversation(
          conversationIdRef.current,
          options.isTest,
          options.greeting,
          trimmed
        );
      } else {
        await appendConversationMessage(conversationIdRef.current, "user", trimmed);
      }

      let full = "";
      const generator = streamAnswer(trimmed, { isTest: options.isTest });
      let next = await generator.next();
      while (!next.done) {
        full += next.value;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
        );
        next = await generator.next();
      }
      const result = next.value;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                streaming: false,
                unanswered: result.unanswered,
                refused: result.refused,
                unavailable: result.unavailable,
                contact: result.contact,
              }
            : m
        )
      );
      setIsSending(false);

      await appendConversationMessage(conversationIdRef.current, "assistant", result.answer);

      if (result.unanswered && !result.refused) {
        await recordUnansweredQuestion(trimmed, options.isTest);
      }
    },
    [isSending, options.isTest, options.greeting]
  );

  return { messages, isSending, sendMessage, reset };
}
