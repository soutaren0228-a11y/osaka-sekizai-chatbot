/**
 * 「見た目」のデータ取得層（本実装）。
 * 下書きは管理画面用の `/api/admin/appearance`、公開版はお客さま向けの
 * `/api/public/bot-config` を経由してSupabaseに保存・取得する。
 */
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

export function defaultAppearanceSettings(): AppearanceSettings {
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

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getDraftAppearance(): Promise<AppearanceSettings> {
  const res = await fetch("/api/admin/appearance");
  const json = await parseJsonOrThrow(res);
  return json.appearance as AppearanceSettings;
}

/** 公開版（お客さま向け）。ウィジェット・テスト画面のどちらからも呼べる公開APIを使う */
export async function getPublishedAppearance(): Promise<AppearanceSettings> {
  const res = await fetch("/api/public/bot-config");
  const json = await parseJsonOrThrow(res);
  return json.appearance as AppearanceSettings;
}

export async function saveDraftAppearance(
  settings: AppearanceSettings
): Promise<void> {
  const res = await fetch("/api/admin/appearance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  await parseJsonOrThrow(res);
}

export function resolveAccentColor(settings: AppearanceSettings): string {
  if (settings.colorPresetKey === "custom") return settings.customColor;
  const preset = COLOR_PRESETS.find((p) => p.key === settings.colorPresetKey);
  return preset?.hex ?? COLOR_PRESETS[0].hex;
}
