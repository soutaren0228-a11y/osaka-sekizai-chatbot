/**
 * 「公開する」処理のとりまとめ。
 * よくある質問・話し方や案内先・見た目の下書きを、それぞれの公開版へコピーし、
 * 未公開の変更ログをクリアする。
 */
import { publishFaqsDraft } from "./faqs";
import { publishPersonaDraft } from "./persona";
import { publishAppearanceDraft } from "./appearance";
import { clearDraftChanges, setLastPublishedAt } from "./publishState";

export async function publishAll(): Promise<void> {
  await Promise.all([
    publishFaqsDraft(),
    publishPersonaDraft(),
    publishAppearanceDraft(),
  ]);
  await clearDraftChanges();
  setLastPublishedAt(new Date().toISOString());
}
