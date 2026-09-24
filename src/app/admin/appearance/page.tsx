import { PageHeader } from "@/components/admin/PageHeader";
import { AppearanceSection } from "@/components/admin/appearance/AppearanceSection";

export default function AppearancePage() {
  return (
    <div>
      <PageHeader
        title="見た目"
        description="チャットの色・表示位置・名前・あいさつ・候補ボタンなど、見た目を設定します。"
      />
      <div className="px-6 py-6">
        <AppearanceSection />
      </div>
    </div>
  );
}
