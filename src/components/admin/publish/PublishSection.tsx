"use client";

import { useState } from "react";
import { usePendingChanges } from "@/hooks/usePendingChanges";
import { publishAll } from "@/lib/data/publish";
import { useToast } from "@/components/ui/ToastProvider";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PublishSection() {
  const { changes, count, loaded, refresh } = usePendingChanges();
  const { showToast } = useToast();
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (publishing || count === 0) return;
    setPublishing(true);
    await publishAll();
    setPublishing(false);
    refresh();
    showToast({ message: "公開しました。お客さま向けチャットに反映されました。" });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">未公開の変更</h2>
        <p className="mt-1 text-sm text-text-muted">
          よくある質問・話し方や案内先・見た目の変更が対象です。「AIに覚えさせる情報」は登録するとすぐに反映されます。
        </p>

        {!loaded ? (
          <p className="mt-4 text-sm text-text-muted">読み込んでいます…</p>
        ) : changes.length === 0 ? (
          <div className="mt-4 rounded-[var(--radius-control)] border border-dashed border-border bg-bg p-6 text-center text-sm text-text-muted">
            公開中の内容と同じです。変更するとここに一覧が表示されます。
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {changes.map((change) => (
              <li
                key={change.id}
                className="flex items-center justify-between rounded-[var(--radius-control)] border border-border bg-bg px-4 py-3 text-sm"
              >
                <span className="text-text">{change.summary}</span>
                <span className="text-xs text-text-muted">{formatDateTime(change.occurredAt)}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || count === 0}
          className="mt-5 h-11 rounded-[var(--radius-control)] bg-navy px-6 text-sm font-medium text-white disabled:opacity-40"
        >
          {publishing ? "公開しています…" : "この内容で公開する"}
        </button>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">公開履歴</h2>
        <p className="mt-1 text-sm text-text-muted">フェーズ3で追加予定です（過去の版を一覧表示し、いつでもその版に戻せるようにします）。</p>
      </section>
    </div>
  );
}
