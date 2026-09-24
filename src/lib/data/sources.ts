/**
 * 「AIに覚えさせる情報」のデータ取得層（フェーズ1・ダミー実装）。
 *
 * 今はブラウザの localStorage を仮のデータベースとして使っている。
 * 将来 Supabase 等の本物のAPIに差し替えるときは、この関数群の中身だけを
 * fetch() 呼び出しに置き換えれば良いように、すべて Promise を返す非同期関数として
 * 定義している。呼び出し側（UI）はこのファイルの外の実装を意識しない。
 */
import { createId } from "@/lib/utils/id";
import type {
  AddPdfInput,
  AddTextInput,
  AddUrlInput,
  SourceRecord,
} from "./types";

const STORAGE_KEY = "osaka-sekizai:sources:v1";
const CHANGE_EVENT = "osaka-sekizai:sources-changed";
const SIMULATED_LOAD_MS = 1400;

function now() {
  return new Date().toISOString();
}

function seedSources(): SourceRecord[] {
  const t = now();
  return [
    {
      id: createId("src"),
      type: "url",
      name: "大阪石材 コーポレートサイト",
      detail: "https://www.osaka-sekizai.jp/",
      sizeLabel: "42ページ・約58,000文字",
      status: "ready",
      active: true,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: createId("src"),
      type: "pdf",
      name: "改 墓石_リフォーム_墓装品_価格表",
      detail: "kakaku-hyou_kaitei.pdf",
      sizeLabel: "18ページ・2.1MB",
      status: "ready",
      active: true,
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): SourceRecord[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedSources();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as SourceRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: SourceRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** 一覧の変化（追加・更新・削除、バックグラウンドの読み込み完了など）を購読する */
export function subscribeSources(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function getSources(): Promise<SourceRecord[]> {
  const records = readAll();
  return [...records].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function insertLoading(record: SourceRecord) {
  const all = readAll();
  writeAll([record, ...all]);
}

function finishLoading(
  id: string,
  patch: Partial<SourceRecord> & Pick<SourceRecord, "status">
) {
  const all = readAll();
  const next = all.map((s) =>
    s.id === id ? { ...s, ...patch, updatedAt: now() } : s
  );
  writeAll(next);
}

/** URLを追加し、バックグラウンドで「読み込み中」→「読み込み済み」に遷移させる（疑似） */
export async function addSourceFromUrl(
  input: AddUrlInput
): Promise<SourceRecord> {
  const record: SourceRecord = {
    id: createId("src"),
    type: "url",
    name: toSiteName(input.url),
    detail: input.url,
    sizeLabel: "読み込み中…",
    status: "loading",
    active: true,
    createdAt: now(),
    updatedAt: now(),
  };
  insertLoading(record);

  window.setTimeout(() => {
    const ok = isValidUrl(input.url);
    if (ok) {
      finishLoading(record.id, {
        status: "ready",
        sizeLabel: `${randomBetween(8, 60)}ページ・約${randomBetween(
          8,
          70
        )},000文字`,
      });
    } else {
      finishLoading(record.id, {
        status: "error",
        sizeLabel: "―",
        errorMessage: "ページを取得できませんでした。URLをご確認ください。",
      });
    }
  }, SIMULATED_LOAD_MS);

  return record;
}

export async function addSourceFromText(
  input: AddTextInput
): Promise<SourceRecord> {
  const record: SourceRecord = {
    id: createId("src"),
    type: "text",
    name: input.title,
    detail: "直接入力したテキスト",
    sizeLabel: "読み込み中…",
    status: "loading",
    active: true,
    createdAt: now(),
    updatedAt: now(),
  };
  insertLoading(record);

  window.setTimeout(() => {
    finishLoading(record.id, {
      status: "ready",
      sizeLabel: `${input.body.length.toLocaleString("ja-JP")}文字`,
    });
  }, SIMULATED_LOAD_MS / 2);

  return record;
}

export async function addSourceFromPdf(
  input: AddPdfInput
): Promise<SourceRecord> {
  const record: SourceRecord = {
    id: createId("src"),
    type: "pdf",
    name: input.fileName.replace(/\.pdf$/i, ""),
    detail: input.fileName,
    sizeLabel: "読み込み中…",
    status: "loading",
    active: true,
    createdAt: now(),
    updatedAt: now(),
  };
  insertLoading(record);

  window.setTimeout(() => {
    const kb = Math.max(1, Math.round(input.fileSizeBytes / 1024));
    finishLoading(record.id, {
      status: "ready",
      sizeLabel: `${randomBetween(1, 24)}ページ・${kb.toLocaleString(
        "ja-JP"
      )}KB`,
    });
  }, SIMULATED_LOAD_MS);

  return record;
}

export async function reloadSource(id: string): Promise<void> {
  const all = readAll();
  const target = all.find((s) => s.id === id);
  if (!target) return;
  finishLoading(id, { status: "loading", sizeLabel: "読み込み中…" });
  window.setTimeout(() => {
    finishLoading(id, { status: "ready", sizeLabel: target.sizeLabel });
  }, SIMULATED_LOAD_MS);
}

export async function deleteSource(id: string): Promise<void> {
  const all = readAll();
  writeAll(all.filter((s) => s.id !== id));
}

export async function restoreSource(record: SourceRecord): Promise<void> {
  const all = readAll();
  writeAll([record, ...all.filter((s) => s.id !== record.id)]);
}

export async function setSourceActive(
  id: string,
  active: boolean
): Promise<void> {
  finishLoading(id, {
    status: readAll().find((s) => s.id === id)?.status ?? "ready",
    active,
  });
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toSiteName(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    return pathname === "/" || pathname === "" ? hostname : `${hostname}${pathname}`;
  } catch {
    return url;
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
