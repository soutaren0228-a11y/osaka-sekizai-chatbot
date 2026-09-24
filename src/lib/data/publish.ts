/**
 * 「公開する」「この版に戻す」処理のとりまとめ。
 * よくある質問・話し方や案内先・見た目の下書きを、それぞれの公開版へコピーし、
 * 未公開の変更ログをクリアしたうえで、公開履歴に1件の版として記録する。
 */
import { getDraftFaqs, publishFaqsDraft, restoreFaqsSnapshot } from "./faqs";
import {
  getDraftPersona,
  publishPersonaDraft,
  restorePersonaSnapshot,
} from "./persona";
import {
  getDraftAppearance,
  publishAppearanceDraft,
  restoreAppearanceSnapshot,
} from "./appearance";
import { clearDraftChanges, getDraftChanges, setLastPublishedAt } from "./publishState";
import {
  createVersionId,
  getPublishHistory,
  recordPublishVersion,
  type PublishVersion,
} from "./publishHistory";

export async function publishAll(publishedBy: string): Promise<void> {
  const changes = await getDraftChanges();

  await Promise.all([
    publishFaqsDraft(),
    publishPersonaDraft(),
    publishAppearanceDraft(),
  ]);

  const [faqs, persona, appearance] = await Promise.all([
    getDraftFaqs(),
    getDraftPersona(),
    getDraftAppearance(),
  ]);

  const now = new Date().toISOString();
  recordPublishVersion({
    id: createVersionId(),
    publishedAt: now,
    publishedBy,
    changeSummaries: changes.map((c) => c.summary),
    snapshot: { faqs, persona, appearance },
  });

  await clearDraftChanges();
  setLastPublishedAt(now);
}

export async function rollbackToVersion(
  versionId: string,
  publishedBy: string
): Promise<PublishVersion | null> {
  const history = await getPublishHistory();
  const target = history.find((v) => v.id === versionId);
  if (!target) return null;

  await Promise.all([
    restoreFaqsSnapshot(target.snapshot.faqs),
    restorePersonaSnapshot(target.snapshot.persona),
    restoreAppearanceSnapshot(target.snapshot.appearance),
  ]);

  const now = new Date().toISOString();
  const label = new Date(target.publishedAt).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const newVersion: PublishVersion = {
    id: createVersionId(),
    publishedAt: now,
    publishedBy,
    changeSummaries: [`${label}の版に戻しました`],
    snapshot: target.snapshot,
  };
  recordPublishVersion(newVersion);

  await clearDraftChanges();
  setLastPublishedAt(now);

  return newVersion;
}
