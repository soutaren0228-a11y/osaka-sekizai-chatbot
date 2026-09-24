import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth/session";
import { Sidebar } from "@/components/admin/Sidebar";
import { TestPanel } from "@/components/admin/TestPanel";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SessionProvider } from "@/components/admin/SessionProvider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return (
    <SessionProvider session={member}>
      <ToastProvider>
        <div className="flex h-dvh overflow-hidden">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
          <aside className="hidden w-[420px] shrink-0 border-l border-border bg-surface lg:flex lg:flex-col">
            <TestPanel />
          </aside>
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
