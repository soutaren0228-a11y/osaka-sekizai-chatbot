"use client";

import { useChatConfig } from "@/hooks/useChatConfig";
import { ChatPanel } from "@/components/chat/ChatPanel";

export function TestPanel() {
  const config = useChatConfig(true);

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        読み込んでいます…
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <ChatPanel config={config} isTest />
    </div>
  );
}
