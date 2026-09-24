import { PageHeader } from "@/components/admin/PageHeader";
import { PublishSection } from "@/components/admin/publish/PublishSection";

export default function PublishPage() {
  return (
    <div>
      <PageHeader
        title="公開と履歴"
        description="変更内容を確認して、お客さま向けチャットに公開します。"
      />
      <div className="px-6 py-6">
        <PublishSection />
      </div>
    </div>
  );
}
