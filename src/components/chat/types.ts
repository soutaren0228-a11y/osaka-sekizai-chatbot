import type { AnswerContact } from "@/lib/answer/generateAnswer";
import type { ChatPosition } from "@/lib/data/appearance";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  unanswered?: boolean;
  refused?: boolean;
  unavailable?: boolean;
  contact?: AnswerContact;
}

export interface ChatConfig {
  botName: string;
  launcherLabel: string;
  greeting: string;
  suggestions: string[];
  disclaimer: string;
  accentColor: string;
  iconDataUrl: string | null;
  position: ChatPosition;
}
