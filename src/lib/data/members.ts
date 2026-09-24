/**
 * 「メンバー」のデータ取得層（フェーズ3・ダミー実装）。
 * メールアドレスで招待し、権限（編集できる／見るだけ）を管理する。
 * 実際の招待メール送信やログインは行わない（本実装ではSupabase Authに置き換える）。
 */
import { createId } from "@/lib/utils/id";
import { compareDesc } from "@/lib/utils/sort";
import { CURRENT_USER_EMAIL } from "./currentUser";

export type MemberRole = "editor" | "viewer";

export interface MemberRecord {
  id: string;
  email: string;
  role: MemberRole;
  invitedAt: string;
  isOwner: boolean;
}

const STORAGE_KEY = "osaka-sekizai:members:v1";
const CHANGE_EVENT = "osaka-sekizai:members-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function seedMembers(): MemberRecord[] {
  return [
    {
      id: createId("member"),
      email: CURRENT_USER_EMAIL,
      role: "editor",
      invitedAt: new Date().toISOString(),
      isOwner: true,
    },
  ];
}

function readAll(): MemberRecord[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedMembers();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as MemberRecord[];
  } catch {
    return [];
  }
}

function writeAll(members: MemberRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeMembers(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function getMembers(): Promise<MemberRecord[]> {
  return [...readAll()].sort((a, b) => compareDesc(a.invitedAt, b.invitedAt));
}

export async function inviteMember(input: {
  email: string;
  role: MemberRole;
}): Promise<MemberRecord> {
  const record: MemberRecord = {
    id: createId("member"),
    email: input.email,
    role: input.role,
    invitedAt: new Date().toISOString(),
    isOwner: false,
  };
  writeAll([record, ...readAll()]);
  return record;
}

export async function changeMemberRole(id: string, role: MemberRole): Promise<void> {
  writeAll(readAll().map((m) => (m.id === id ? { ...m, role } : m)));
}

export async function removeMember(id: string): Promise<void> {
  writeAll(readAll().filter((m) => m.id !== id));
}

export async function restoreMember(record: MemberRecord): Promise<void> {
  writeAll([record, ...readAll().filter((m) => m.id !== record.id)]);
}
