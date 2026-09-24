"use client";

import { useState } from "react";
import { useChatConfig } from "@/hooks/useChatConfig";
import { ChatPanel } from "./ChatPanel";

/** お客さま向けチャット。常に公開版の見た目・内容を表示する */
export function FloatingChatLauncher() {
  const [open, setOpen] = useState(false);
  const config = useChatConfig(false);

  if (!config) return null;

  const sideClass = config.position === "right" ? "right-5" : "left-5";

  return (
    <div className={`fixed bottom-5 z-50 ${sideClass}`}>
      {open && (
        <div
          className="fixed inset-0 z-50 sm:static sm:inset-auto sm:mb-3 sm:h-[600px] sm:w-[380px] sm:overflow-hidden sm:rounded-[var(--radius-card)] sm:border sm:border-border sm:shadow-2xl"
          role="dialog"
          aria-label={config.botName}
        >
          <ChatPanel config={config} isTest={false} onClose={() => setOpen(false)} />
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-14 items-center gap-2 rounded-full px-5 text-sm font-bold text-white shadow-lg hover:opacity-90"
          style={{ backgroundColor: config.accentColor }}
        >
          <span aria-hidden>💬</span>
          {config.launcherLabel}
        </button>
      )}
    </div>
  );
}
