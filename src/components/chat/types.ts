export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  unanswered?: boolean;
}

export interface ChatConfig {
  botName: string;
  launcherLabel: string;
  greeting: string;
  suggestions: string[];
  disclaimer: string;
}

export const defaultChatConfig: ChatConfig = {
  botName: "コーポレートサイト案内ボット",
  launcherLabel: "AIに相談する",
  greeting:
    "こんにちは。大阪石材の案内ボットです。お墓じまいや戒名彫刻など、気になることをお気軽にご質問ください。",
  suggestions: [
    "お墓じまいの金額・相場は？",
    "お墓じまいの流れは？",
    "戒名彫刻の費用は？",
  ],
  disclaimer:
    "AIによる自動回答です。内容は参考情報であり、正式な金額はお見積もりでご確認ください。",
};
