/**
 * 「利用状況」のデータ取得層（フェーズ3・ダミー実装）。
 *
 * 今月の利用状況は固定のダミー値。本実装ではAPI利用料の実績値に置き換える。
 * 下書き/公開の対象外で、保存するとすぐに反映される（緊急時に使う設定のため）。
 */
import { CURRENT_USER_EMAIL } from "./currentUser";

export interface UsageSettings {
  monthlyLimitYen: number;
  /** ダミーの今月の利用額（本実装ではAPI利用ログから集計する） */
  currentUsageYen: number;
  notifyEmail: string;
  unavailableMessage: string;
  /** 動作確認用：上限に達した状態を強制的に試す */
  forceUnavailable: boolean;
}

const STORAGE_KEY = "osaka-sekizai:usage:v1";
const CHANGE_EVENT = "osaka-sekizai:usage-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function defaultSettings(): UsageSettings {
  return {
    monthlyLimitYen: 50000,
    currentUsageYen: 12340,
    notifyEmail: CURRENT_USER_EMAIL,
    unavailableMessage:
      "現在ご利用いただけません。しばらく経ってから改めてお試しいただくか、お電話でお問い合わせください。",
    forceUnavailable: false,
  };
}

export async function getUsageSettings(): Promise<UsageSettings> {
  if (!isBrowser()) return defaultSettings();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = defaultSettings();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return { ...defaultSettings(), ...(JSON.parse(raw) as UsageSettings) };
  } catch {
    return defaultSettings();
  }
}

export async function saveUsageSettings(settings: UsageSettings): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeUsage(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function isOverLimit(settings: UsageSettings): boolean {
  return settings.forceUnavailable || settings.currentUsageYen >= settings.monthlyLimitYen;
}
