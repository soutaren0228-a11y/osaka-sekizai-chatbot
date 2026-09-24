"use client";

import { useEffect, useId, useState } from "react";
import {
  TONE_OPTIONS,
  getDraftPersona,
  saveDraftPersona,
  type BannedTopic,
  type PersonaSettings,
} from "@/lib/data/persona";
import { createId } from "@/lib/utils/id";
import { useToast } from "@/components/ui/ToastProvider";

export function PersonaSection() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<PersonaSettings | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const phoneId = useId();
  const urlId = useId();
  const newTopicId = useId();

  useEffect(() => {
    getDraftPersona().then(setSettings);
  }, []);

  if (!settings) {
    return <p className="text-sm text-text-muted">読み込んでいます…</p>;
  }

  function toggleTopic(id: string) {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            bannedTopics: prev.bannedTopics.map((t) =>
              t.id === id ? { ...t, enabled: !t.enabled } : t
            ),
          }
        : prev
    );
  }

  function removeTopic(id: string) {
    setSettings((prev) =>
      prev
        ? { ...prev, bannedTopics: prev.bannedTopics.filter((t) => t.id !== id) }
        : prev
    );
  }

  function addTopic() {
    const label = newTopic.trim();
    if (!label) return;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            bannedTopics: [
              ...prev.bannedTopics,
              { id: createId("topic"), label, enabled: true, isPreset: false } as BannedTopic,
            ],
          }
        : prev
    );
    setNewTopic("");
  }

  async function handleSave() {
    if (!settings || saving) return;
    setSaving(true);
    await saveDraftPersona(settings);
    setSaving(false);
    showToast({ message: "保存しました。右のテスト画面で試せます。" });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">口調</h2>
        <p className="mt-1 text-sm text-text-muted">
          お答えできない場合などの案内文の話し方を選べます。
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TONE_OPTIONS.map((option) => {
            const selected = settings.tone === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSettings({ ...settings, tone: option.key })}
                aria-pressed={selected}
                className={`flex min-h-11 flex-col gap-2 rounded-[var(--radius-control)] border p-4 text-left transition-colors ${
                  selected ? "border-navy bg-navy-light" : "border-border bg-bg hover:bg-surface"
                }`}
              >
                <span className="font-heading text-sm font-bold text-text">{option.label}</span>
                <span className="text-xs leading-relaxed text-text-muted">{option.example}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">答えさせない話題</h2>
        <p className="mt-1 text-sm text-text-muted">
          チェックした話題の質問には、丁寧にお断りして案内先をお伝えします。
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {settings.bannedTopics.map((topic) => (
            <div key={topic.id} className="flex items-center gap-3">
              <input
                id={`topic-${topic.id}`}
                type="checkbox"
                checked={topic.enabled}
                onChange={() => toggleTopic(topic.id)}
                className="h-5 w-5 shrink-0 accent-navy"
              />
              <label htmlFor={`topic-${topic.id}`} className="flex-1 text-sm text-text">
                {topic.label}
              </label>
              {!topic.isPreset && (
                <button
                  type="button"
                  onClick={() => removeTopic(topic.id)}
                  className="h-9 rounded-[var(--radius-control)] px-2 text-xs font-medium text-danger hover:bg-danger-light"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor={newTopicId} className="mb-1 block text-sm font-medium text-text">
              話題を追加
            </label>
            <input
              id={newTopicId}
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="例：施工の日程についての確約"
              className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            />
          </div>
          <button
            type="button"
            onClick={addTopic}
            disabled={!newTopic.trim()}
            className="h-11 rounded-[var(--radius-control)] border border-navy px-4 text-sm font-medium text-navy hover:bg-navy-light disabled:opacity-40"
          >
            追加
          </button>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">答えられないときの案内先</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={phoneId} className="mb-1 block text-sm font-medium text-text">
              電話番号
            </label>
            <input
              id={phoneId}
              type="tel"
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            />
          </div>
          <div>
            <label htmlFor={urlId} className="mb-1 block text-sm font-medium text-text">
              お問い合わせページのURL
            </label>
            <input
              id={urlId}
              type="url"
              value={settings.contactUrl}
              onChange={(e) => setSettings({ ...settings, contactUrl: e.target.value })}
              className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="h-11 self-start rounded-[var(--radius-control)] bg-navy px-6 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? "保存しています…" : "変更を保存"}
      </button>
    </div>
  );
}
