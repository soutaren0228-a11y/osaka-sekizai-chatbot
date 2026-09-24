/**
 * 「公開履歴」のデータ取得層（フェーズ3）。
 * 公開する・この版に戻すのたびに、その時点のよくある質問・話し方や案内先・見た目の
 * スナップショットを1件の版として記録する。
 */
import { createId } from "@/lib/utils/id";
import { compareDesc } from "@/lib/utils/sort";
import type { FaqRecord } from "./faqs";
import type { PersonaSettings } from "./persona";
import type { AppearanceSettings } from "./appearance";

export interface PublishVersion {
  id: string;
  publishedAt: string;
  publishedBy: string;
  /** この版で公開した変更点（「未公開の変更」ログの要約） */
  changeSummaries: string[];
  snapshot: {
    faqs: FaqRecord[];
    persona: PersonaSettings;
    appearance: AppearanceSettings;
  };
}

const KEY = "osaka-sekizai:publish-history:v1";
const EVENT = "osaka-sekizai:publish-history-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): PublishVersion[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PublishVersion[];
  } catch {
    return [];
  }
}

function writeAll(versions: PublishVersion[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(versions));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribePublishHistory(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function getPublishHistory(): Promise<PublishVersion[]> {
  return [...readAll()].sort((a, b) => compareDesc(a.publishedAt, b.publishedAt));
}

export function recordPublishVersion(version: PublishVersion): void {
  writeAll([version, ...readAll()]);
}

export function createVersionId(): string {
  return createId("version");
}
