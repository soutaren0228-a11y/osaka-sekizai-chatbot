const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN = /0\d{1,4}-\d{1,4}-\d{3,4}|0\d{9,10}/g;

/** 電話番号・メールアドレスらしき文字列を伏せる（会話ログ画面での表示用） */
export function maskPii(text: string): string {
  return text
    .replace(EMAIL_PATTERN, "（メールアドレスを伏せました）")
    .replace(PHONE_PATTERN, "（電話番号を伏せました）");
}
