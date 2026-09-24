"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUnanswered } from "@/hooks/useUnanswered";
import { useCanEdit } from "@/hooks/useCanEdit";
import { useSession } from "@/components/admin/SessionProvider";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/authBrowser";

interface NavItem {
  key: string;
  label: string;
  href?: string;
  note?: string;
}

const navItems: NavItem[] = [
  { key: "home", label: "ホーム", href: "/admin" },
  { key: "sources", label: "AIに覚えさせる情報", href: "/admin/sources" },
  { key: "faq", label: "よくある質問", href: "/admin/faq" },
  { key: "unanswered", label: "答えられなかった質問", href: "/admin/unanswered" },
  { key: "persona", label: "話し方・ルール", href: "/admin/persona" },
  { key: "appearance", label: "見た目", href: "/admin/appearance" },
  { key: "usage", label: "利用状況", href: "/admin/usage" },
  { key: "members", label: "メンバー", href: "/admin/members" },
  { key: "publish", label: "公開と履歴", href: "/admin/publish" },
  { key: "conversations", label: "会話ログ", href: "/admin/conversations" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { entries } = useUnanswered();
  const canEdit = useCanEdit();
  const { email } = useSession();

  async function handleLogout() {
    const supabase = getSupabaseAuthBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
        const badgeCount = item.key === "unanswered" ? entries.length : 0;

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
            className={`flex min-h-11 items-center justify-between rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-navy text-white" : "text-text hover:bg-bg"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span>{item.label}</span>
            {badgeCount > 0 && (
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  isActive ? "bg-white text-navy" : "bg-danger text-white"
                }`}
              >
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
        <p className="truncate px-2 text-xs text-text-muted">{email}</p>
        {!canEdit && (
          <p className="rounded-[var(--radius-control)] bg-bg px-2 py-1.5 text-xs font-bold text-text-muted">
            見るだけの権限で表示中
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 items-center rounded-[var(--radius-control)] px-3 text-sm font-medium text-text-muted hover:bg-bg"
        >
          ログアウト
        </button>
      </div>
    </nav>
  );
}
