import { ChatPanel } from "@/components/chat/ChatPanel";
import { defaultChatConfig } from "@/components/chat/types";

export function TestPanel() {
  return (
    <div className="h-full min-h-0">
      <ChatPanel config={defaultChatConfig} isTest />
    </div>
  );
}
