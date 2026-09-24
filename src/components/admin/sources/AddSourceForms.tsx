"use client";

import { useId, useRef, useState } from "react";
import {
  addSourceFromPdf,
  addSourceFromText,
  addSourceFromUrl,
} from "@/lib/data/sources";
import { useToast } from "@/components/ui/ToastProvider";
import { useCanEdit } from "@/hooks/useCanEdit";

type TabKey = "url" | "pdf" | "text";

const tabs: { key: TabKey; label: string }[] = [
  { key: "url", label: "ページのURL" },
  { key: "pdf", label: "PDF" },
  { key: "text", label: "文章を直接入力" },
];

export function AddSourceForms() {
  const [activeTab, setActiveTab] = useState<TabKey>("url");
  const { showToast } = useToast();
  const canEdit = useCanEdit();

  function handleAdded() {
    showToast({ message: "追加しました。右のテスト画面で試せます。" });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface">
      <div role="tablist" aria-label="情報の追加方法" className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`h-11 flex-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-navy text-navy"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <fieldset disabled={!canEdit} className="p-5">
        {activeTab === "url" && <UrlForm onAdded={handleAdded} />}
        {activeTab === "pdf" && <PdfForm onAdded={handleAdded} />}
        {activeTab === "text" && <TextForm onAdded={handleAdded} />}
      </fieldset>
    </div>
  );
}

function UrlForm({ onAdded }: { onAdded: () => void }) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    await addSourceFromUrl({ url: url.trim() });
    setSubmitting(false);
    setUrl("");
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        トップページのURLを入れると、サイト内のページをまとめて読み込みます。
      </p>
      <div>
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-text">
          ページのURL
        </label>
        <input
          id={inputId}
          type="url"
          required
          placeholder="https://www.osaka-sekizai.jp/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !url.trim()}
        className="h-11 self-start rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
      >
        {submitting ? "追加しています…" : "追加する"}
      </button>
    </form>
  );
}

function PdfForm({ onAdded }: { onAdded: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file || submitting) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }
    setSubmitting(true);
    await addSourceFromPdf({ file });
    setSubmitting(false);
    onAdded();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        価格表や案内資料などのPDFをドラッグ＆ドロップ、またはファイルを選んで追加します。
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files[0] ?? null);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border-2 border-dashed p-8 text-center ${
          dragOver ? "border-navy bg-navy-light" : "border-border bg-bg"
        }`}
      >
        <p className="text-sm text-text-muted">ここにPDFをドラッグ＆ドロップ</p>
        <span className="text-xs text-text-muted">または</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting}
          className="h-11 rounded-[var(--radius-control)] border border-navy px-4 text-sm font-medium text-navy hover:bg-navy-light disabled:opacity-40"
        >
          {submitting ? "追加しています…" : "ファイルを選ぶ"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          aria-label="PDFファイルを選ぶ"
        />
      </div>
    </div>
  );
}

function TextForm({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleId = useId();
  const bodyId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    await addSourceFromText({ title: title.trim(), body: body.trim() });
    setSubmitting(false);
    setTitle("");
    setBody("");
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor={titleId} className="mb-1 block text-sm font-medium text-text">
          タイトル
        </label>
        <input
          id={titleId}
          type="text"
          required
          placeholder="例：営業時間・定休日について"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        />
      </div>
      <div>
        <label htmlFor={bodyId} className="mb-1 block text-sm font-medium text-text">
          本文
        </label>
        <textarea
          id={bodyId}
          required
          rows={5}
          placeholder="AIに覚えさせたい内容を入力してください"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-y rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !title.trim() || !body.trim()}
        className="h-11 self-start rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
      >
        {submitting ? "追加しています…" : "追加する"}
      </button>
    </form>
  );
}
