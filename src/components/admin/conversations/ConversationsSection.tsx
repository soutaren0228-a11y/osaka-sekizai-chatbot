"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useCanEdit } from "@/hooks/useCanEdit";
import {
  getConversationRetentionDays,
  setConversationRetentionDays,
} from "@/lib/data/conversations";
import type { ConversationRecord } from "@/lib/data/conversations";
import { maskPii } from "@/lib/utils/maskPii";
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

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

function summaryOf(conversation: ConversationRecord): string {
  const firstUser = conversation.messages.find((m) => m.role === "user");
  return firstUser ? maskPii(firstUser.content) : "（質問なし）";
}

export function ConversationsSection() {
  const { conversations, loaded } = useConversations(false);
  const canEdit = useCanEdit();
  const { showToast } = useToast();
  const [dateFilter, setDateFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retentionDays, setRetentionDays] = useState(90);
  const [savingRetention, setSavingRetention] = useState(false);
  const retentionId = useId();

  useEffect(() => {
    getConversationRetentionDays().then(setRetentionDays);
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (dateFilter && toDateInputValue(c.startedAt) !== dateFilter) return false;
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        const hasMatch = c.messages.some((m) => m.content.toLowerCase().includes(k));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [conversations, dateFilter, keyword]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  async function handleSaveRetention() {
    if (!canEdit || savingRetention) return;
    setSavingRetention(true);
    await setConversationRetentionDays(retentionDays);
    setSavingRetention(false);
    showToast({ message: "保存期間を保存しました。" });
  }

  return (
    <div className="flex flex-col gap-6">
      {!canEdit && <ReadOnlyNotice />}

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">保存期間</h2>
        <p className="mt-1 text-sm text-text-muted">
          会話ログを保存しておく期間です（この試作では自動削除は行われません）。
        </p>
        <div className="mt-3 flex items-end gap-2">
          <div>
            <label htmlFor={retentionId} className="mb-1 block text-sm font-medium text-text">
              保存期間（日）
            </label>
            <select
              id={retentionId}
              value={retentionDays}
              disabled={!canEdit}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="h-11 rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm disabled:opacity-50"
            >
              {[30, 90, 180, 365].map((d) => (
                <option key={d} value={d}>
                  {d}日
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSaveRetention}
            disabled={!canEdit || savingRetention}
            className="h-11 rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            {savingRetention ? "保存しています…" : "保存する"}
          </button>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="conversation-date" className="mb-1 block text-sm font-medium text-text">
            日付で絞り込む
          </label>
          <input
            id="conversation-date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="conversation-keyword" className="mb-1 block text-sm font-medium text-text">
            質問で検索
          </label>
          <input
            id="conversation-keyword"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="キーワードを入力"
            className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="flex flex-col gap-2">
          {!loaded ? (
            <p className="text-sm text-text-muted">読み込んでいます…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-bg p-6 text-center text-sm text-text-muted">
              {conversations.length > 0
                ? "検索条件に一致する会話がありません。"
                : "まだ会話がありません。お客さま向けチャットで質問があると、ここに記録されます。"}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-[var(--radius-card)] border px-4 py-3 text-left text-sm ${
                      selectedId === c.id
                        ? "border-navy bg-navy-light"
                        : "border-border bg-surface hover:bg-bg"
                    }`}
                  >
                    <p className="line-clamp-2 font-medium text-text">{summaryOf(c)}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDateTime(c.startedAt)} ・ {c.messages.length}件のやり取り
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          {!selected ? (
            <p className="text-sm text-text-muted">左の一覧から会話を選ぶと、内容を確認できます。</p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-muted">開始日時：{formatDateTime(selected.startedAt)}</p>
              {selected.messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-[var(--radius-control)] px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-navy text-white"
                        : "border border-border bg-navy-light text-text"
                    }`}
                  >
                    {maskPii(m.content)}
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-muted">
                電話番号・メールアドレスらしき文字列は自動的に伏せて表示しています。
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
