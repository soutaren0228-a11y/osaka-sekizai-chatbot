"use client";

import { useState } from "react";
import { usePendingChanges } from "@/hooks/usePendingChanges";
import { publishAll } from "@/lib/data/publish";
import { useToast } from "@/components/ui/ToastProvider";

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { count, loaded, refresh } = usePendingChanges();
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
    <div className="border-b border-border bg-surface px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-lg font-bold text-text">{title}</h1>
          <p className="mt-0.5 text-sm text-text-muted">{description}</p>
        </div>

        {loaded && (
          <div className="flex items-center gap-3">
            {count === 0 ? (
              <p className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-muted">
                公開中の内容と同じです
              </p>
            ) : (
              <>
                <p className="rounded-full border border-navy/30 bg-navy-light px-3 py-1.5 text-xs font-medium text-navy">
                  未公開の変更 {count}件
                </p>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="h-11 rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
                >
                  {publishing ? "公開しています…" : "公開する"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
