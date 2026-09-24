import { PageHeader } from "@/components/admin/PageHeader";
import { PersonaSection } from "@/components/admin/persona/PersonaSection";

export default function PersonaPage() {
  return (
    <div>
      <PageHeader
        title="話し方・ルール"
        description="AIの話し方や、答えないようにする話題、案内先を設定します。"
      />
      <div className="px-6 py-6">
        <PersonaSection />
      </div>
    </div>
  );
}
