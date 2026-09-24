import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center">
        <p className="text-xs font-medium text-text-muted">試作（フェーズ1・ダミーデータ版）</p>
        <h1 className="mt-2 font-heading text-xl font-bold text-text">
          大阪石材 AIチャットボット
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          管理画面とお客さま向けチャットのUI/UX試作です。確認したい画面を選んでください。
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/admin"
            className="flex h-11 items-center justify-center rounded-[var(--radius-control)] bg-navy text-sm font-medium text-white"
          >
            管理画面を開く
          </Link>
          <Link
            href="/widget-demo"
            className="flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-navy text-sm font-medium text-navy"
          >
            お客さま向けチャットの見本を開く
          </Link>
        </div>
      </div>
    </div>
  );
}
