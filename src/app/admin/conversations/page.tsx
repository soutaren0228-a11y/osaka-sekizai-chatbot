import { PageHeader } from "@/components/admin/PageHeader";
import { ConversationsSection } from "@/components/admin/conversations/ConversationsSection";

export default function ConversationsPage() {
  return (
    <div>
      <PageHeader
        title="会話ログ"
        description="お客さま向けチャットでの会話を確認できます（テスト画面での会話は含みません）。"
      />
      <div className="px-6 py-6">
        <ConversationsSection />
      </div>
    </div>
  );
}
