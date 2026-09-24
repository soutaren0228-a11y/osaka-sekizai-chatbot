"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  key: string;
  label: string;
  href?: string;
  note?: string;
}

const navItems: NavItem[] = [
  { key: "home", label: "ホーム", href: "/admin" },
  { key: "sources", label: "AIに覚えさせる情報", href: "/admin/sources" },
  { key: "faq", label: "よくある質問", note: "フェーズ2で追加予定" },
  { key: "unanswered", label: "答えられなかった質問", note: "フェーズ2で追加予定" },
  { key: "persona", label: "話し方・ルール", note: "フェーズ2で追加予定" },
  { key: "appearance", label: "見た目", note: "フェーズ2で追加予定" },
  { key: "members", label: "メンバー", note: "フェーズ3で追加予定" },
  { key: "publish", label: "公開と履歴", note: "フェーズ3で追加予定" },
  { key: "conversations", label: "会話ログ", note: "フェーズ3で追加予定" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="管理メニュー"
      className="flex h-full w-[250px] shrink-0 flex-col gap-1 border-r border-border bg-surface px-3 py-5"
    >
      <div className="mb-4 px-2">
        <p className="font-heading text-sm font-bold text-navy">大阪石材</p>
        <p className="text-xs text-text-muted">AIチャットボット管理画面</p>
      </div>

      {navItems.map((item) => {
        const isActive = item.href && pathname === item.href;
        if (!item.href) {
          return (
            <div
              key={item.key}
              className="flex min-h-11 flex-col justify-center rounded-[var(--radius-control)] px-3 py-2 text-sm text-text-muted/60"
              aria-disabled="true"
            >
              <span>{item.label}</span>
              <span className="text-[11px]">{item.note}</span>
            </div>
          );
        }
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex min-h-11 items-center rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-navy text-white"
                : "text-text hover:bg-bg"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
