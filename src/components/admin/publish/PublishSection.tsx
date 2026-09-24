"use client";

import { useState } from "react";
import { usePendingChanges } from "@/hooks/usePendingChanges";
import { usePublishHistory } from "@/hooks/usePublishHistory";
import { useCanEdit } from "@/hooks/useCanEdit";
import { publishAll, rollbackToVersion } from "@/lib/data/publish";
import { useToast } from "@/components/ui/ToastProvider";
import { ReadOnlyNotice } from "@/components/admin/ReadOnlyNotice";

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
  const { versions, loaded: historyLoaded, refresh: refreshHistory } = usePublishHistory();
  const canEdit = useCanEdit();
  const { showToast } = useToast();
  const [publishing, setPublishing] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  async function handlePublish() {
    if (publishing || count === 0 || !canEdit) return;
    setPublishing(true);
    await publishAll();
    setPublishing(false);
    refresh();
    refreshHistory();
    showToast({ message: "公開しました。お客さま向けチャットに反映されました。" });
  }

  async function handleRollback(versionId: string, label: string) {
    if (rollingBackId || !canEdit) return;
    setRollingBackId(versionId);
    await rollbackToVersion(versionId);
    setRollingBackId(null);
    refresh();
    refreshHistory();
    showToast({ message: `${label}の版に戻しました。お客さま向けチャットに反映されました。` });
  }

  return (
    <div className="flex flex-col gap-6">
      {!canEdit && <ReadOnlyNotice />}

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
          disabled={publishing || count === 0 || !canEdit}
          className="mt-5 h-11 rounded-[var(--radius-control)] bg-navy px-6 text-sm font-medium text-white disabled:opacity-40"
        >
          {publishing ? "公開しています…" : "この内容で公開する"}
        </button>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">公開履歴</h2>
        <p className="mt-1 text-sm text-text-muted">
          「公開する」を押すたびに版が記録されます。「この版に戻す」を押すと、今の下書きの変更は上書きされます。
        </p>

        {!historyLoaded ? (
          <p className="mt-4 text-sm text-text-muted">読み込んでいます…</p>
        ) : versions.length === 0 ? (
          <div className="mt-4 rounded-[var(--radius-control)] border border-dashed border-border bg-bg p-6 text-center text-sm text-text-muted">
            まだ公開履歴がありません。「公開する」を押すと、ここに記録されます。
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {versions.map((version, index) => {
              const label = formatDateTime(version.publishedAt);
              const isLatest = index === 0;
              return (
                <li
                  key={version.id}
                  className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-border bg-bg p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">
                      {label}
                      {isLatest && (
                        <span className="ml-2 rounded-full bg-navy-light px-2 py-0.5 text-xs font-bold text-navy">
                          現在公開中
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">公開した人：{version.publishedBy}</p>
                    {version.changeSummaries.length > 0 ? (
                      <ul className="mt-2 list-disc pl-5 text-sm text-text-muted">
                        {version.changeSummaries.map((summary, i) => (
                          <li key={i}>{summary}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-text-muted">変更点の記録はありません。</p>
                    )}
                  </div>
                  {!isLatest && (
                    <button
                      type="button"
                      onClick={() => handleRollback(version.id, label)}
                      disabled={rollingBackId !== null || !canEdit}
                      className="h-11 shrink-0 rounded-[var(--radius-control)] border border-navy px-3 text-sm font-medium text-navy hover:bg-navy-light disabled:opacity-40"
                    >
                      {rollingBackId === version.id ? "戻しています…" : "この版に戻す"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
