/**
 * 「話し方・ルール」のデータ取得層（本実装）。
 *
 * 下書きは `/api/admin/persona` を経由してSupabase（bots.draft_persona）に保存する。
 * 公開版はチャットAPI／ウィジェット公開設定APIがサーバー側で直接読むため、
 * ここには公開版を読み取るクライアント関数を用意していない。
 */
import { createId } from "@/lib/utils/id";

export type ToneKey = "polite" | "friendly" | "concise";

export interface BannedTopic {
  id: string;
  label: string;
  enabled: boolean;
  isPreset: boolean;
}

export interface PersonaSettings {
  tone: ToneKey;
  bannedTopics: BannedTopic[];
  contactPhone: string;
  contactUrl: string;
}

export const TONE_OPTIONS: { key: ToneKey; label: string; example: string }[] = [
  {
    key: "polite",
    label: "丁寧",
    example:
      "恐れ入りますが、登録されている情報の中からはお答えできませんでした。お手数ですが、下記までお問い合わせください。",
  },
  {
    key: "friendly",
    label: "親しみやすい",
    example:
      "ごめんなさい、その内容はまだ登録されていないみたいです。よければ下記からお問い合わせくださいね。",
  },
  {
    key: "concise",
    label: "簡潔",
    example: "登録情報にはありません。下記へお問い合わせください。",
  },
];

const PRESET_TOPIC_LABELS = [
  "他社との比較",
  "値引きの交渉",
  "宗派・しきたりの断定",
  "採用・求人について",
];

export function defaultPersonaSettings(): PersonaSettings {
  return {
    tone: "polite",
    bannedTopics: PRESET_TOPIC_LABELS.map((label) => ({
      id: createId("topic"),
      label,
      enabled: true,
      isPreset: true,
    })),
    contactPhone: "0120-1114-90",
    contactUrl: "https://www.osaka-sekizai.jp/contact/",
  };
}

async function parseJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `リクエストに失敗しました (${res.status})`);
  }
  return json;
}

export async function getDraftPersona(): Promise<PersonaSettings> {
  const res = await fetch("/api/admin/persona");
  const json = await parseJsonOrThrow(res);
  return json.persona as PersonaSettings;
}

export async function saveDraftPersona(settings: PersonaSettings): Promise<void> {
  const res = await fetch("/api/admin/persona", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  await parseJsonOrThrow(res);
}
