import { PageHeader } from "@/components/admin/PageHeader";
import { UsageSection } from "@/components/admin/usage/UsageSection";

export default function UsagePage() {
  return (
    <div>
      <PageHeader
        title="利用状況"
        description="AIの利用状況と、月の利用上限・上限に達したときの案内を設定します。"
      />
      <div className="px-6 py-6">
        <UsageSection />
      </div>
    </div>
  );
}
