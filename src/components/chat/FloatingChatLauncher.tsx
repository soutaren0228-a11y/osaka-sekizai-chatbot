"use client";

import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import type { ChatConfig } from "./types";

interface FloatingChatLauncherProps {
  config: ChatConfig;
  position?: "right" | "left";
}

export function FloatingChatLauncher({
  config,
  position = "right",
}: FloatingChatLauncherProps) {
  const [open, setOpen] = useState(false);
  const sideClass = position === "right" ? "right-5" : "left-5";

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
          className="flex h-14 items-center gap-2 rounded-full bg-navy px-5 text-sm font-bold text-white shadow-lg hover:bg-navy-dark"
        >
          <span aria-hidden>💬</span>
          {config.launcherLabel}
        </button>
      )}
    </div>
  );
}
