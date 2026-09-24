/**
 * 「見た目」のデータ取得層（フェーズ2・ダミー実装）。
 * 下書き（テスト画面が参照）と公開版（お客さま向けチャットが参照）を分けて保持する。
 */
import { recordDraftChange } from "./publishState";

export type ChatPosition = "right" | "left";

export interface ColorPreset {
  key: string;
  label: string;
  hex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { key: "navy", label: "紺", hex: "#1F3A7A" },
  { key: "green", label: "緑", hex: "#1F7A4D" },
  { key: "teal", label: "青緑", hex: "#0F766E" },
  { key: "orange", label: "オレンジ", hex: "#C2410C" },
  { key: "black", label: "黒", hex: "#1C1C1A" },
];

export const MAX_SUGGESTIONS = 6;

export interface AppearanceSettings {
  colorPresetKey: string; // COLOR_PRESETS の key、または "custom"
  customColor: string;
  position: ChatPosition;
  iconDataUrl: string | null;
  botName: string;
  launcherLabel: string;
  greeting: string;
  disclaimer: string;
  suggestions: string[];
}

const DRAFT_KEY = "osaka-sekizai:appearance:draft:v1";
const PUBLISHED_KEY = "osaka-sekizai:appearance:published:v1";
const CHANGE_EVENT = "osaka-sekizai:appearance-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function defaultSettings(): AppearanceSettings {
  return {
    colorPresetKey: "navy",
    customColor: "#1F3A7A",
    position: "right",
    iconDataUrl: null,
    botName: "コーポレートサイト案内ボット",
    launcherLabel: "AIに相談する",
    greeting:
      "こんにちは。大阪石材の案内ボットです。お墓じまいや戒名彫刻など、気になることをお気軽にご質問ください。",
    disclaimer:
      "AIによる自動回答です。内容は参考情報であり、正式な金額はお見積もりでご確認ください。",
    suggestions: [
      "お墓じまいの金額・相場は？",
      "お墓じまいの流れは？",
      "戒名彫刻の費用は？",
    ],
  };
}

function readKey(key: string): AppearanceSettings {
  if (!isBrowser()) return defaultSettings();
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const seeded = defaultSettings();
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return { ...defaultSettings(), ...(JSON.parse(raw) as AppearanceSettings) };
  } catch {
    return defaultSettings();
  }
}

function writeDraft(settings: AppearanceSettings) {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeAppearance(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function getDraftAppearance(): Promise<AppearanceSettings> {
  return readKey(DRAFT_KEY);
}

export async function getPublishedAppearance(): Promise<AppearanceSettings> {
  return readKey(PUBLISHED_KEY);
}

export async function saveDraftAppearance(
  settings: AppearanceSettings
): Promise<void> {
  writeDraft(settings);
  recordDraftChange("見た目を更新しました");
}

export async function publishAppearanceDraft(): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(PUBLISHED_KEY, JSON.stringify(readKey(DRAFT_KEY)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** 過去の版に戻す：下書き・公開版の両方を指定の内容で上書きする */
export async function restoreAppearanceSnapshot(
  settings: AppearanceSettings
): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
  window.localStorage.setItem(PUBLISHED_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function resolveAccentColor(settings: AppearanceSettings): string {
  if (settings.colorPresetKey === "custom") return settings.customColor;
  const preset = COLOR_PRESETS.find((p) => p.key === settings.colorPresetKey);
  return preset?.hex ?? COLOR_PRESETS[0].hex;
}
