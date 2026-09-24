import { contactInfo } from "@/lib/answer/generateAnswer";
import type { ChatMessage } from "./types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[var(--radius-control)] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-navy text-white"
            : "bg-navy-light text-text border border-border"
        }`}
      >
        {message.content.length === 0 && message.streaming ? (
          <TypingDots />
        ) : (
          <>{message.content}</>
        )}
        {!message.streaming && message.unanswered && (
          <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-3">
            <a
              href={contactInfo.phoneHref}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] bg-navy px-3 text-sm font-medium text-white"
            >
              電話で問い合わせる（{contactInfo.phone}）
            </a>
            <a
              href={contactInfo.contactUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-navy px-3 text-sm font-medium text-navy"
            >
              お問い合わせページを開く
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="入力中">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
    </span>
  );
}
