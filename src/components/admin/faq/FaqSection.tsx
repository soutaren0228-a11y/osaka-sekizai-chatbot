"use client";

import { useId, useState } from "react";
import { useFaqs } from "@/hooks/useFaqs";
import { useCanEdit } from "@/hooks/useCanEdit";
import { addFaq, deleteFaq, restoreFaq, updateFaq } from "@/lib/data/faqs";
import type { FaqRecord } from "@/lib/data/faqs";
import { useToast } from "@/components/ui/ToastProvider";
import { ReadOnlyNotice } from "@/components/admin/ReadOnlyNotice";

export function FaqSection() {
  const { faqs, loaded, refresh } = useFaqs();
  const canEdit = useCanEdit();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [keyword, setKeyword] = useState("");

  const questionId = useId();
  const answerId = useId();

  function startEdit(faq: FaqRecord) {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
  }

  function cancelEdit() {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || submitting || !canEdit) return;
    setSubmitting(true);
    if (editingId) {
      await updateFaq(editingId, { question: question.trim(), answer: answer.trim() });
      showToast({ message: "更新しました。右のテスト画面で試せます。" });
    } else {
      await addFaq({ question: question.trim(), answer: answer.trim() });
      showToast({ message: "追加しました。右のテスト画面で試せます。" });
    }
    setSubmitting(false);
    cancelEdit();
  }

  async function handleDelete(faq: FaqRecord) {
    if (!canEdit) return;
    await deleteFaq(faq.id);
    if (editingId === faq.id) cancelEdit();
    showToast({
      message: `「${faq.question}」を削除しました。`,
      action: {
        label: "元に戻す",
        onClick: async () => {
          await restoreFaq(faq);
          refresh();
        },
      },
    });
  }

  const filtered = faqs.filter((f) =>
    keyword.trim()
      ? `${f.question}${f.answer}`.toLowerCase().includes(keyword.trim().toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col gap-6">
      {!canEdit && <ReadOnlyNotice />}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        <h2 className="font-heading text-base font-bold text-text">
          {editingId ? "よくある質問を編集" : "よくある質問を追加"}
        </h2>
        <div>
          <label htmlFor={questionId} className="mb-1 block text-sm font-medium text-text">
            お客さまの質問
          </label>
          <input
            id={questionId}
            type="text"
            required
            placeholder="例：お墓じまいの金額・相場は？"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          />
        </div>
        <div>
          <label htmlFor={answerId} className="mb-1 block text-sm font-medium text-text">
            AIに答えてほしい内容
          </label>
          <textarea
            id={answerId}
            required
            rows={4}
            placeholder="お客さまへの回答文をそのまま入力してください"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full resize-y rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canEdit || submitting || !question.trim() || !answer.trim()}
            className="h-11 rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            {editingId ? "更新する" : "追加する"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="h-11 rounded-[var(--radius-control)] border border-border px-4 text-sm font-medium text-text-muted hover:bg-bg"
            >
              編集をやめる
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="mb-3 font-heading text-base font-bold text-text">登録済みのよくある質問</h2>
        <label htmlFor="faq-search" className="sr-only">
          よくある質問をキーワードで検索
        </label>
        <input
          id="faq-search"
          type="search"
          placeholder="質問や回答で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="mb-3 h-11 w-full max-w-sm rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        />

        {!loaded ? (
          <p className="text-sm text-text-muted">読み込んでいます…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-bg p-8 text-center text-sm text-text-muted">
            {faqs.length > 0
              ? "検索条件に一致するよくある質問がありません。"
              : "まだよくある質問が登録されていません。上のフォームから追加してください。"}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((faq) => (
              <li
                key={faq.id}
                className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text">{faq.question}</p>
                  {faq.answer.trim() ? (
                    <p className="mt-1 line-clamp-2 text-sm text-text-muted">{faq.answer}</p>
                  ) : (
                    <p className="mt-1 text-sm text-danger">回答が未入力です（このままではチャットで使われません）</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(faq)}
                    disabled={!canEdit}
                    className="h-11 rounded-[var(--radius-control)] border border-border px-3 text-sm font-medium text-text hover:bg-bg disabled:opacity-50"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(faq)}
                    disabled={!canEdit}
                    className="h-11 rounded-[var(--radius-control)] border border-danger px-3 text-sm font-medium text-danger hover:bg-danger-light disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
