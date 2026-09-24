import { PageHeader } from "@/components/admin/PageHeader";
import { FaqSection } from "@/components/admin/faq/FaqSection";

export default function FaqPage() {
  return (
    <div>
      <PageHeader
        title="よくある質問"
        description="お客さまからよく聞かれる質問と、その回答を登録します。質問の意味が近ければ、この回答が優先して使われます。"
      />
      <div className="px-6 py-6">
        <FaqSection />
      </div>
    </div>
  );
}
