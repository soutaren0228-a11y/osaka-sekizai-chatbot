/**
 * 「AIに覚えさせる情報」1件分のデータ型。
 *
 * 今回のフェーズではブラウザ内の仮データ（localStorage）で表現しているが、
 * 将来 Supabase 等の実データに差し替えても、この型と sources.ts の関数シグネチャは
 * 変えずに済むように設計している。
 */
export type SourceType = "url" | "pdf" | "text";

export type SourceStatus = "loading" | "ready" | "error";

export interface SourceRecord {
  id: string;
  type: SourceType;
  /** 一覧に表示する名前（サイト名・ファイル名・テキストのタイトル） */
  name: string;
  /** URLやファイル名など、名前の下に添える補足情報 */
  detail: string;
  /** 「◯文字」「◯ページ・◯KB」などの表示用ラベル */
  sizeLabel: string;
  status: SourceStatus;
  errorMessage?: string;
  /** チャットで使う／使わない */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddUrlInput {
  url: string;
}

export interface AddTextInput {
  title: string;
  body: string;
}

export interface AddPdfInput {
  file: File;
}
