import { PageHeader } from "@/components/admin/PageHeader";
import { AddSourceForms } from "@/components/admin/sources/AddSourceForms";
import { SourceList } from "@/components/admin/sources/SourceList";

export default function SourcesPage() {
  return (
    <div>
      <PageHeader
        title="AIに覚えさせる情報"
        description="ページのURL・PDF・文章を登録すると、チャットボットがその内容をもとに答えられるようになります。"
      />

      <div className="space-y-6 px-6 py-6">
        <AddSourceForms />

        <section>
          <h2 className="mb-3 font-heading text-base font-bold text-text">
            登録済みの情報
          </h2>
          <SourceList />
        </section>
      </div>
    </div>
  );
}
