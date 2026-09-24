/**
 * 「公開する」「この版に戻す」のデータ取得層（本実装）。
 * 公開した人はサーバー側でログイン中のメンバーから判定するため、
 * ここでは呼び出すだけでよい。
 */
async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function publishAll(): Promise<void> {
  const res = await fetch("/api/admin/publish", { method: "POST" });
  await parseJsonOrThrow(res);
}

export async function rollbackToVersion(versionId: string): Promise<void> {
  const res = await fetch(`/api/admin/publish/${versionId}/rollback`, {
    method: "POST",
  });
  await parseJsonOrThrow(res);
}
