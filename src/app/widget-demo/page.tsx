import { FloatingChatLauncher } from "@/components/chat/FloatingChatLauncher";
import { defaultChatConfig } from "@/components/chat/types";

export default function WidgetDemoPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="font-heading text-lg font-bold text-navy">大阪石材（サイト見本）</p>
          <nav className="hidden gap-6 text-sm text-text-muted sm:flex">
            <span>会社案内</span>
            <span>お墓じまい</span>
            <span>戒名彫刻</span>
            <span>価格表</span>
            <span>お問い合わせ</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-8">
          <p className="text-xs font-medium text-text-muted">
            このページは、サイトに1行のタグを埋め込んだときのチャットの見た目を確認するための試作デモです。
          </p>
          <h1 className="mt-3 font-heading text-2xl font-bold text-text">
            お墓のことなら、大阪石材にお任せください
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
            お墓じまい、戒名彫刻、お墓の引っ越し・リフォームなど、お墓に関するご相談を承っております。
            画面右下の「{defaultChatConfig.launcherLabel}」ボタンから、AIチャットボットにご質問いただけます。
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {["お墓じまい", "戒名彫刻", "お墓の引っ越し・リフォーム"].map((title) => (
            <div
              key={title}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
            >
              <h2 className="font-heading text-sm font-bold text-text">{title}</h2>
              <p className="mt-2 text-sm text-text-muted">
                サービス内容のご紹介（ダミーテキスト）です。詳しくはチャットでもご質問いただけます。
              </p>
            </div>
          ))}
        </div>
      </main>

      <FloatingChatLauncher config={defaultChatConfig} position="right" />
    </div>
  );
}
