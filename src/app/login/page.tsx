import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/login/LoginForm";

export default async function LoginPage() {
  const member = await getCurrentMember();
  if (member) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-heading text-lg font-bold text-navy">大阪石材</p>
          <p className="text-sm text-text-muted">AIチャットボット管理画面</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
