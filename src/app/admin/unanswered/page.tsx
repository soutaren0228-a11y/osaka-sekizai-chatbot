import { PageHeader } from "@/components/admin/PageHeader";
import { UnansweredSection } from "@/components/admin/unanswered/UnansweredSection";

export default function UnansweredPage() {
  return (
    <div>
      <PageHeader
        title="答えられなかった質問"
        description="AIが登録情報の中から答えられなかった質問の一覧です。回答を書いてよくある質問に追加できます。"
      />
      <div className="px-6 py-6">
        <UnansweredSection />
      </div>
    </div>
  );
}
