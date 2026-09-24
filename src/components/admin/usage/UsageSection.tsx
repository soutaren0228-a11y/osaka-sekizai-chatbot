"use client";

import { useEffect, useId, useState } from "react";
import { getUsageSettings, saveUsageSettings, isOverLimit } from "@/lib/data/usage";
import type { UsageSettings } from "@/lib/data/usage";
import { useCanEdit } from "@/hooks/useCanEdit";
import { useToast } from "@/components/ui/ToastProvider";
import { ReadOnlyNotice } from "@/components/admin/ReadOnlyNotice";

export function UsageSection() {
  const canEdit = useCanEdit();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<UsageSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const limitId = useId();
  const emailId = useId();
  const messageId = useId();

  useEffect(() => {
    getUsageSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <p className="text-sm text-text-muted">読み込んでいます…</p>;
  }

  function update<K extends keyof UsageSettings>(key: K, value: UsageSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!settings || !canEdit || saving) return;
    setSaving(true);
    await saveUsageSettings(settings);
    setSaving(false);
    if (settings.forceUnavailable) {
      showToast({
        message: `${settings.notifyEmail || "通知先"}に通知しました（試作のため実際には送信されません）。`,
      });
    } else {
      showToast({ message: "保存しました。" });
    }
  }

  const percent = Math.min(
    100,
    Math.round((settings.currentUsageYen / Math.max(1, settings.monthlyLimitYen)) * 100)
  );
  const over = isOverLimit(settings);

  return (
    <div className="flex flex-col gap-6">
      {!canEdit && <ReadOnlyNotice />}

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">今月の利用状況</h2>
        <p className="mt-1 text-sm text-text-muted">
          ¥{settings.currentUsageYen.toLocaleString("ja-JP")} ／ ¥
          {settings.monthlyLimitYen.toLocaleString("ja-JP")}（上限）
        </p>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-bg">
          <div
            className={`h-full rounded-full ${over ? "bg-danger" : "bg-navy"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {over && (
          <p className="mt-3 rounded-[var(--radius-control)] bg-danger-light px-3 py-2 text-sm text-danger">
            現在、利用上限に達しています。お客さま向けチャットには案内文のみが表示されます。
          </p>
        )}
        <p className="mt-2 text-xs text-text-muted">
          ※ この試作では固定のダミー値です。本実装ではAPI利用料の実績値に置き換えます。
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">上限と案内</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label htmlFor={limitId} className="mb-1 block text-sm font-medium text-text">
              月の利用上限（円）
            </label>
            <input
              id={limitId}
              type="number"
              min={0}
              step={1000}
              disabled={!canEdit}
              value={settings.monthlyLimitYen}
              onChange={(e) => update("monthlyLimitYen", Number(e.target.value))}
              className="h-11 w-full max-w-xs rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor={emailId} className="mb-1 block text-sm font-medium text-text">
              通知先メールアドレス
            </label>
            <input
              id={emailId}
              type="email"
              disabled={!canEdit}
              value={settings.notifyEmail}
              onChange={(e) => update("notifyEmail", e.target.value)}
              className="h-11 w-full max-w-md rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-text-muted">上限に達したときに、ここへ通知します。</p>
          </div>
          <div>
            <label htmlFor={messageId} className="mb-1 block text-sm font-medium text-text">
              上限に達したときにお客さまへ表示する文言
            </label>
            <textarea
              id={messageId}
              rows={3}
              disabled={!canEdit}
              value={settings.unavailableMessage}
              onChange={(e) => update("unavailableMessage", e.target.value)}
              className="w-full resize-y rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-50"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">動作確認用</h2>
        <label className="mt-2 flex items-center gap-3 text-sm text-text">
          <input
            type="checkbox"
            checked={settings.forceUnavailable}
            disabled={!canEdit}
            onChange={(e) => update("forceUnavailable", e.target.checked)}
            className="h-5 w-5 accent-navy disabled:opacity-50"
          />
          上限に達した状態を試す（保存すると、テスト画面・お客さま向けチャットの両方に反映されます）
        </label>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={!canEdit || saving}
        className="h-11 self-start rounded-[var(--radius-control)] bg-navy px-6 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? "保存しています…" : "変更を保存"}
      </button>
    </div>
  );
}
