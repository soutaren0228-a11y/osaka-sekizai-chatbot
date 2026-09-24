"use client";

import { useCallback, useRef, useState } from "react";
import { streamChatMessage } from "@/lib/chat/streamChat";
import { createId } from "@/lib/utils/id";
import type { ChatMessage } from "@/components/chat/types";

export function useChatSession(options: { isTest: boolean; greeting: string }) {
  const initial: ChatMessage[] = [
    { id: createId("msg"), role: "assistant", content: options.greeting },
  ];
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [isSending, setIsSending] = useState(false);
  const conversationIdRef = useRef(createId("conv"));

  const reset = useCallback(() => {
    setMessages([{ id: createId("msg"), role: "assistant", content: options.greeting }]);
    conversationIdRef.current = createId("conv");
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

      try {
        let full = "";
        const generator = streamChatMessage(trimmed, {
          isTest: options.isTest,
          conversationId: conversationIdRef.current,
        });
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
                  unanswered: result.status === "unanswered",
                  refused: result.status === "refused",
                  unavailable: result.status === "unavailable",
                  contact: result.contact,
                }
              : m
          )
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  streaming: false,
                  content: err instanceof Error ? err.message : "エラーが発生しました",
                }
              : m
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [isSending, options.isTest]
  );

  return { messages, isSending, sendMessage, reset };
}
