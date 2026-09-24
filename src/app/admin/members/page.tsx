import { PageHeader } from "@/components/admin/PageHeader";
import { MembersSection } from "@/components/admin/members/MembersSection";

export default function MembersPage() {
  return (
    <div>
      <PageHeader
        title="メンバー"
        description="管理画面を使える人をメールアドレスで招待し、権限を設定します。"
      />
      <div className="px-6 py-6">
        <MembersSection />
      </div>
    </div>
  );
}
