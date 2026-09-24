/**
 * 「会話ログ」のデータ取得層（本実装）。
 * 実際の記録は `/api/chat` がサーバー側で行う
 * （src/lib/data/server/conversationLog.ts）。ここでは管理画面の閲覧・設定用の
 * 薄いラッパーのみを提供する。
 */
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface ConversationRecord {
  id: string;
  isTest: boolean;
  startedAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getConversations(options: {
  isTest: boolean;
}): Promise<ConversationRecord[]> {
  const res = await fetch(`/api/admin/conversations?isTest=${options.isTest}`);
  const json = await parseJsonOrThrow(res);
  return json.conversations as ConversationRecord[];
}

export async function getConversationRetentionDays(): Promise<number> {
  const res = await fetch("/api/admin/conversations/retention");
  const json = await parseJsonOrThrow(res);
  return json.retentionDays as number;
}

export async function setConversationRetentionDays(days: number): Promise<void> {
  const res = await fetch("/api/admin/conversations/retention", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ retentionDays: days }),
  });
  await parseJsonOrThrow(res);
}
