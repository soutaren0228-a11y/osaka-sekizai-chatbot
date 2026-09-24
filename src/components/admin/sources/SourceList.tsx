"use client";

import { useState } from "react";
import { useSources } from "@/hooks/useSources";
import {
  deleteSource,
  reloadSource,
  restoreSource,
  setSourceActive,
} from "@/lib/data/sources";
import type { SourceRecord, SourceType } from "@/lib/data/types";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/ToastProvider";
import { useCanEdit } from "@/hooks/useCanEdit";

const typeLabels: Record<SourceType, string> = {
  url: "URL",
  pdf: "PDF",
  text: "テキスト",
};

export function SourceList() {
  const { sources, loaded, refresh } = useSources();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const [keyword, setKeyword] = useState("");

  const filtered = sources.filter((s) =>
    keyword.trim()
      ? `${s.name}${s.detail}`.toLowerCase().includes(keyword.trim().toLowerCase())
      : true
  );

  async function handleDelete(record: SourceRecord) {
    if (!canEdit) return;
    await deleteSource(record.id);
    showToast({
      message: `「${record.name}」を削除しました。`,
      action: {
        label: "元に戻す",
        onClick: async () => {
          await restoreSource(record);
          refresh();
        },
      },
    });
  }

  async function handleToggle(record: SourceRecord, active: boolean) {
    if (!canEdit) return;
    await setSourceActive(record.id, active);
    showToast({
      message: active
        ? `「${record.name}」をチャットで使うようにしました。`
        : `「${record.name}」をチャットで使わないようにしました。`,
    });
  }

  async function handleReload(record: SourceRecord) {
    if (!canEdit) return;
    await reloadSource(record.id);
    showToast({ message: `「${record.name}」を再読み込みしています。` });
  }

  if (!loaded) {
    return <p className="px-1 text-sm text-text-muted">読み込んでいます…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="source-search" className="sr-only">
          登録済みの情報をキーワードで検索
        </label>
        <input
          id="source-search"
          type="search"
          placeholder="名前やURLで検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="h-11 w-full max-w-sm rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasAnySource={sources.length > 0} />
      ) : (
        <fieldset disabled={!canEdit} className="contents">
          <ul className="flex flex-col gap-2">
            {filtered.map((record) => (
              <SourceRow
                key={record.id}
                record={record}
                onDelete={() => handleDelete(record)}
                onToggle={(active) => handleToggle(record, active)}
                onReload={() => handleReload(record)}
              />
            ))}
          </ul>
        </fieldset>
      )}
    </div>
  );
}

function EmptyState({ hasAnySource }: { hasAnySource: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-bg p-8 text-center text-sm text-text-muted">
      {hasAnySource
        ? "検索条件に一致する情報がありません。"
        : "まだ情報が登録されていません。上のフォームからページのURL・PDF・文章を追加してください。"}
    </div>
  );
}

function SourceRow({
  record,
  onDelete,
  onToggle,
  onReload,
}: {
  record: SourceRecord;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  onReload: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-full bg-navy-light px-2.5 py-1 text-xs font-bold text-navy">
          {typeLabels[record.type]}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{record.name}</p>
          <p className="truncate text-xs text-text-muted">{record.detail}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <span>{record.sizeLabel}</span>
            <StatusLabel record={record} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <Switch
            checked={record.active}
            onChange={onToggle}
            label={`${record.name}をチャットで使う`}
          />
          <span className="text-xs text-text-muted">
            {record.active ? "チャットで使う" : "チャットで使わない"}
          </span>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={record.status === "loading"}
          className="h-11 rounded-[var(--radius-control)] border border-border px-3 text-sm font-medium text-text hover:bg-bg disabled:opacity-40"
        >
          再読み込み
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-11 rounded-[var(--radius-control)] border border-danger px-3 text-sm font-medium text-danger hover:bg-danger-light"
        >
          削除
        </button>
      </div>
    </li>
  );
}

function StatusLabel({ record }: { record: SourceRecord }) {
  if (record.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1 text-navy">
        <span className="h-2 w-2 animate-pulse rounded-full bg-navy" />
        読み込み中…
      </span>
    );
  }
  if (record.status === "error") {
    return (
      <span className="text-danger">
        失敗しました{record.errorMessage ? `（${record.errorMessage}）` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-success">
      <span className="h-2 w-2 rounded-full bg-success" />
      読み込み済み
    </span>
  );
}
