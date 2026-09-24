/**
 * 「メンバー」のデータ取得層（本実装）。
 * `/api/admin/members` を経由してSupabase Auth（招待）と members テーブルを操作する。
 */
export type MemberRole = "editor" | "viewer";

export interface MemberRecord {
  id: string;
  email: string;
  role: MemberRole;
  invitedAt: string;
  isOwner: boolean;
}

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getMembers(): Promise<MemberRecord[]> {
  const res = await fetch("/api/admin/members");
  const json = await parseJsonOrThrow(res);
  return json.members as MemberRecord[];
}

export async function inviteMember(input: {
  email: string;
  role: MemberRole;
}): Promise<MemberRecord> {
  const res = await fetch("/api/admin/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await parseJsonOrThrow(res);
  return json.member as MemberRecord;
}

export async function changeMemberRole(id: string, role: MemberRole): Promise<void> {
  const res = await fetch(`/api/admin/members/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  await parseJsonOrThrow(res);
}

export async function removeMember(id: string): Promise<void> {
  const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res);
}

/** 削除の「元に戻す」：同じメールアドレス・権限で招待し直す */
export async function restoreMember(record: MemberRecord): Promise<void> {
  await inviteMember({ email: record.email, role: record.role });
}
