"use client";

import { useState } from "react";
import { useUnanswered } from "@/hooks/useUnanswered";
import {
  dismissUnanswered,
  reopenUnanswered,
  removeUnanswered,
} from "@/lib/data/unanswered";
import type { UnansweredEntry } from "@/lib/data/unanswered";
import { addFaq } from "@/lib/data/faqs";
import { useToast } from "@/components/ui/ToastProvider";
import { useCanEdit } from "@/hooks/useCanEdit";
import { ReadOnlyNotice } from "@/components/admin/ReadOnlyNotice";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function UnansweredSection() {
  const { entries, loaded, refresh } = useUnanswered();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const [openAnswerId, setOpenAnswerId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");

  async function handleDismiss(entry: UnansweredEntry) {
    if (!canEdit) return;
    await dismissUnanswered(entry.id);
    if (openAnswerId === entry.id) setOpenAnswerId(null);
    showToast({
      message: `「${entry.question}」を対応しないにしました。`,
      action: {
        label: "元に戻す",
        onClick: async () => {
          await reopenUnanswered(entry.id);
          refresh();
        },
      },
    });
  }

  async function handleAddToFaq(entry: UnansweredEntry) {
    if (!answerDraft.trim() || !canEdit) return;
    await addFaq({ question: entry.question, answer: answerDraft.trim() });
    await removeUnanswered(entry.id);
    setOpenAnswerId(null);
    setAnswerDraft("");
    showToast({ message: "よくある質問に追加しました。右のテスト画面で試せます。" });
  }

  if (!loaded) {
    return <p className="text-sm text-text-muted">読み込んでいます…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-bg p-8 text-center text-sm text-text-muted">
        すべて対応済みです。テスト画面やお客さま向けチャットで未登録の質問を送ると、ここに追加されます。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!canEdit && <ReadOnlyNotice />}
      <fieldset disabled={!canEdit} className="contents">
      <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-[var(--radius-card)] border border-border bg-surface p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-text">{entry.question}</p>
                {entry.testOnly && (
                  <span className="rounded-full bg-navy-light px-2 py-0.5 text-xs font-bold text-navy">
                    テスト
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {entry.count}回 質問されました ・ 最終：{formatDate(entry.lastAskedAt)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpenAnswerId(openAnswerId === entry.id ? null : entry.id);
                  setAnswerDraft("");
                }}
                className="h-11 rounded-[var(--radius-control)] border border-navy px-3 text-sm font-medium text-navy hover:bg-navy-light"
              >
                回答を書く
              </button>
              <button
                type="button"
                onClick={() => handleDismiss(entry)}
                className="h-11 rounded-[var(--radius-control)] border border-border px-3 text-sm font-medium text-text-muted hover:bg-bg"
              >
                対応しない
              </button>
            </div>
          </div>

          {openAnswerId === entry.id && (
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <label htmlFor={`answer-${entry.id}`} className="text-sm font-medium text-text">
                AIに答えてほしい内容
              </label>
              <textarea
                id={`answer-${entry.id}`}
                rows={3}
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                placeholder="お客さまへの回答文を入力してください"
                className="w-full resize-y rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              />
              <button
                type="button"
                onClick={() => handleAddToFaq(entry)}
                disabled={!answerDraft.trim()}
                className="h-11 self-start rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
              >
                よくある質問に追加
              </button>
            </div>
          )}
        </li>
      ))}
      </ul>
      </fieldset>
    </div>
  );
}
