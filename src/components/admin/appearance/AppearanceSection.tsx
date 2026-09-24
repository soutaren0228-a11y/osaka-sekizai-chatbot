"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  COLOR_PRESETS,
  MAX_SUGGESTIONS,
  getDraftAppearance,
  saveDraftAppearance,
  type AppearanceSettings,
} from "@/lib/data/appearance";
import { useToast } from "@/components/ui/ToastProvider";

export function AppearanceSection() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const botNameId = useId();
  const launcherLabelId = useId();
  const greetingId = useId();
  const disclaimerId = useId();
  const suggestionInputId = useId();

  useEffect(() => {
    getDraftAppearance().then(setSettings);
  }, []);

  if (!settings) {
    return <p className="text-sm text-text-muted">読み込んでいます…</p>;
  }

  function update<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleIconFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("iconDataUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function addSuggestion() {
    if (!settings) return;
    const label = newSuggestion.trim();
    if (!label || settings.suggestions.length >= MAX_SUGGESTIONS) return;
    update("suggestions", [...settings.suggestions, label]);
    setNewSuggestion("");
  }

  function removeSuggestion(index: number) {
    if (!settings) return;
    update(
      "suggestions",
      settings.suggestions.filter((_, i) => i !== index)
    );
  }

  async function handleSave() {
    if (!settings || saving) return;
    setSaving(true);
    await saveDraftAppearance(settings);
    setSaving(false);
    showToast({ message: "保存しました。右のテスト画面で確認できます。" });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">テーマの色</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => update("colorPresetKey", preset.key)}
              aria-pressed={settings.colorPresetKey === preset.key}
              className={`flex h-11 items-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-medium ${
                settings.colorPresetKey === preset.key
                  ? "border-navy bg-navy-light"
                  : "border-border bg-bg"
              }`}
            >
              <span
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: preset.hex }}
                aria-hidden
              />
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => update("colorPresetKey", "custom")}
            aria-pressed={settings.colorPresetKey === "custom"}
            className={`flex h-11 items-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-medium ${
              settings.colorPresetKey === "custom"
                ? "border-navy bg-navy-light"
                : "border-border bg-bg"
            }`}
          >
            <span
              className="h-5 w-5 rounded-full border border-border"
              style={{ backgroundColor: settings.customColor }}
              aria-hidden
            />
            自由に指定
          </button>
          {settings.colorPresetKey === "custom" && (
            <label className="flex h-11 items-center gap-2 text-sm text-text-muted">
              色を選ぶ
              <input
                type="color"
                value={settings.customColor}
                onChange={(e) => update("customColor", e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-border"
                aria-label="チャットのテーマ色"
              />
            </label>
          )}
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">表示位置・アイコン</h2>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <fieldset className="flex items-center gap-4">
            <legend className="mb-1 w-full text-sm font-medium text-text">表示位置</legend>
            {(["right", "left"] as const).map((pos) => (
              <label key={pos} className="flex h-11 items-center gap-2 text-sm text-text">
                <input
                  type="radio"
                  name="position"
                  checked={settings.position === pos}
                  onChange={() => update("position", pos)}
                  className="h-5 w-5 accent-navy"
                />
                {pos === "right" ? "右下" : "左下"}
              </label>
            ))}
          </fieldset>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text">アイコン画像</span>
            {settings.iconDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.iconDataUrl}
                alt=""
                className="h-11 w-11 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg text-xs text-text-muted">
                石
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 rounded-[var(--radius-control)] border border-border px-3 text-sm font-medium text-text hover:bg-bg"
            >
              画像を選ぶ
            </button>
            {settings.iconDataUrl && (
              <button
                type="button"
                onClick={() => update("iconDataUrl", null)}
                className="h-11 rounded-[var(--radius-control)] px-3 text-sm font-medium text-danger hover:bg-danger-light"
              >
                削除
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="アイコン画像を選ぶ"
              onChange={(e) => handleIconFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">名前・あいさつ</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label htmlFor={botNameId} className="mb-1 block text-sm font-medium text-text">
              チャットの名前
            </label>
            <input
              id={botNameId}
              type="text"
              value={settings.botName}
              onChange={(e) => update("botName", e.target.value)}
              className="h-11 w-full max-w-md rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            />
          </div>
          <div>
            <label htmlFor={launcherLabelId} className="mb-1 block text-sm font-medium text-text">
              呼び出しボタンの文字
            </label>
            <input
              id={launcherLabelId}
              type="text"
              value={settings.launcherLabel}
              onChange={(e) => update("launcherLabel", e.target.value)}
              className="h-11 w-full max-w-md rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            />
          </div>
          <div>
            <label htmlFor={greetingId} className="mb-1 block text-sm font-medium text-text">
              最初のあいさつ
            </label>
            <textarea
              id={greetingId}
              rows={3}
              value={settings.greeting}
              onChange={(e) => update("greeting", e.target.value)}
              className="w-full resize-y rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            />
          </div>
          <div>
            <label htmlFor={disclaimerId} className="mb-1 block text-sm font-medium text-text">
              入力欄の下の注意書き
            </label>
            <textarea
              id={disclaimerId}
              rows={2}
              value={settings.disclaimer}
              onChange={(e) => update("disclaimer", e.target.value)}
              className="w-full resize-y rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="font-heading text-base font-bold text-text">質問の候補ボタン</h2>
        <p className="mt-1 text-sm text-text-muted">最大{MAX_SUGGESTIONS}個まで追加できます。</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.suggestions.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="flex h-11 items-center gap-2 rounded-full border border-navy/30 bg-navy-light px-3 text-sm text-navy"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSuggestion(i)}
                aria-label={`「${s}」を削除`}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-navy/10"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor={suggestionInputId} className="mb-1 block text-sm font-medium text-text">
              候補を追加
            </label>
            <input
              id={suggestionInputId}
              type="text"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              disabled={settings.suggestions.length >= MAX_SUGGESTIONS}
              placeholder="例：お墓の引っ越しについて相談したい"
              className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-40"
            />
          </div>
          <button
            type="button"
            onClick={addSuggestion}
            disabled={!newSuggestion.trim() || settings.suggestions.length >= MAX_SUGGESTIONS}
            className="h-11 rounded-[var(--radius-control)] border border-navy px-4 text-sm font-medium text-navy hover:bg-navy-light disabled:opacity-40"
          >
            追加
          </button>
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
