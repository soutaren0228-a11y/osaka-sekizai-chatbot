import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

const steps = [
  {
    number: 1,
    title: "情報を登録",
    description: "ページのURL・PDF・文章で、AIに覚えさせたい情報を登録します。",
    href: "/admin/sources",
    linkLabel: "AIに覚えさせる情報を開く",
  },
  {
    number: 2,
    title: "テストで確認",
    description: "画面右の「テスト画面」で、実際にお客さまと同じように質問して確かめます。",
    href: "/admin/sources",
    linkLabel: "情報を登録してテストする",
  },
  {
    number: 3,
    title: "公開する",
    description: "内容を確認できたら、公開ボタンでお客さまに見えるようにします。",
    href: undefined,
    linkLabel: "フェーズ2で追加予定",
  },
];

export default function AdminHomePage() {
  return (
    <div>
      <PageHeader
        title="ホーム"
        description="この画面では、チャットボットの使い方の流れを確認できます。"
      />

      <div className="space-y-6 px-6 py-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <h2 className="font-heading text-base font-bold text-text">
            使い方は3ステップ
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-border bg-bg p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {step.number}
                </div>
                <h3 className="font-heading text-sm font-bold text-text">
                  {step.title}
                </h3>
                <p className="text-sm text-text-muted">{step.description}</p>
                {step.href ? (
                  <Link
                    href={step.href}
                    className="mt-1 inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-navy px-3 text-sm font-medium text-navy hover:bg-navy-light"
                  >
                    {step.linkLabel}
                  </Link>
                ) : (
                  <span className="mt-1 inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-border px-3 text-sm text-text-muted/70">
                    {step.linkLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <h2 className="font-heading text-base font-bold text-text">今回の試作について</h2>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">
            今回はUI/UXの試作段階です。表示されているデータはすべて仮のデータで、AIの回答も
            「よくある質問との簡易一致」によるダミー応答です。本番では、実際のサイト内容やPDFを
            AIに読み込ませ、Claude
            APIによる回答に差し替える予定です。右の「テスト画面」から、今の見た目と流れを試せます。
          </p>
        </section>
      </div>
    </div>
  );
}
