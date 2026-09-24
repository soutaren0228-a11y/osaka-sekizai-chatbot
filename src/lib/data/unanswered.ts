/**
 * 「答えられなかった質問」のデータ取得層（本実装）。
 * 記録自体は `/api/chat` がサーバー側で行う（src/lib/data/server/unansweredServer.ts）。
 * ここでは管理画面の一覧・操作用の薄いラッパーのみを提供する。
 */
export interface UnansweredEntry {
  id: string;
  question: string;
  count: number;
  lastAskedAt: string;
  /** これまでの発生がすべてテスト画面からのものか */
  testOnly: boolean;
  status: "open" | "dismissed";
}

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getUnansweredQuestions(): Promise<UnansweredEntry[]> {
  const res = await fetch("/api/admin/unanswered");
  const json = await parseJsonOrThrow(res);
  return json.entries as UnansweredEntry[];
}

export async function dismissUnanswered(id: string): Promise<void> {
  const res = await fetch(`/api/admin/unanswered/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "dismissed" }),
  });
  await parseJsonOrThrow(res);
}

export async function reopenUnanswered(id: string): Promise<void> {
  const res = await fetch(`/api/admin/unanswered/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "open" }),
  });
  await parseJsonOrThrow(res);
}

export async function removeUnanswered(id: string): Promise<void> {
  const res = await fetch(`/api/admin/unanswered/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res);
}
