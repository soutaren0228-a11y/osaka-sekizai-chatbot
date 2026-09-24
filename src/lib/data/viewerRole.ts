/**
 * 「今、自分がどの権限で管理画面を見ているか」の試作用の切り替え。
 *
 * 本実装ではログインしたメンバーの権限がそのまま使われるため、この切り替えUIは不要になる。
 * 今回はログイン機能がないため、動作確認のためにメンバー画面から権限を切り替えられるようにしている。
 */
import type { MemberRole } from "./members";

const STORAGE_KEY = "osaka-sekizai:viewer-role:v1";
const CHANGE_EVENT = "osaka-sekizai:viewer-role-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

export async function getViewerRole(): Promise<MemberRole> {
  if (!isBrowser()) return "editor";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "viewer" ? "viewer" : "editor";
}

export function setViewerRole(role: MemberRole): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, role);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeViewerRole(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
