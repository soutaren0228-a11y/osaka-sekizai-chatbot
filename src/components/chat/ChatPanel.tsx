"use client";

import { useEffect, useRef, useState } from "react";
import { useChatSession } from "@/hooks/useChatSession";
import { MessageBubble } from "./MessageBubble";
import type { ChatConfig } from "./types";

interface ChatPanelProps {
  config: ChatConfig;
  isTest: boolean;
  onClose?: () => void;
  botIconLabel?: string;
}

export function ChatPanel({ config, isTest, onClose, botIconLabel }: ChatPanelProps) {
  const { messages, isSending, sendMessage, reset } = useChatSession({
    isTest,
    greeting: config.greeting,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const hasUserMessage = messages.some((m) => m.role === "user");

  function handleSend() {
    if (!input.trim()) return;
    void sendMessage(input);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white"
            aria-hidden
          >
            {botIconLabel ?? "石"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold text-text">
              {config.botName}
            </p>
            {isTest && (
              <p className="text-xs text-text-muted">テスト画面（下書きの内容で試せます）</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isTest && (
            <button
              type="button"
              onClick={reset}
              className="h-9 rounded-[var(--radius-control)] border border-border px-3 text-xs font-medium text-text-muted hover:bg-bg"
            >
              リセット
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="チャットを閉じる"
              className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-bg"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {!hasUserMessage && config.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          {config.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              className="h-11 rounded-full border border-navy/30 bg-navy-light px-3 text-xs font-medium text-navy hover:bg-navy/10"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <ChatInputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isSending}
      />

      <p className="border-t border-border px-4 py-2 text-[11px] leading-relaxed text-text-muted">
        {config.disclaimer}
      </p>
    </div>
  );
}

function ChatInputBar({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const composingRef = useRef(false);

  return (
    <div className="flex items-end gap-2 border-t border-border px-3 py-3">
      <label htmlFor="chat-message-input" className="sr-only">
        質問を入力
      </label>
      <textarea
        id="chat-message-input"
        rows={1}
        value={value}
        maxLength={500}
        placeholder="ご質問を入力してください"
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !composingRef.current) {
            e.preventDefault();
            onSend();
          }
        }}
        className="max-h-28 min-h-11 flex-1 resize-none rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="h-11 shrink-0 rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        送信
      </button>
    </div>
  );
}
