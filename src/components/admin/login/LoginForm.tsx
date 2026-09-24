"use client";

import { useId, useState } from "react";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/authBrowser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const emailId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    setErrorMessage("");

    try {
      const supabase = getSupabaseAuthBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "送信に失敗しました");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 text-center">
        <p className="font-heading text-base font-bold text-text">メールを送信しました</p>
        <p className="mt-2 text-sm text-text-muted">
          {email} 宛にログイン用のリンクを送りました。メール内のリンクを開いてください。
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-6"
    >
      <div>
        <label htmlFor={emailId} className="mb-1 block text-sm font-medium text-text">
          メールアドレス
        </label>
        <input
          id={emailId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@osaka-sekizai.jp"
          className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        />
      </div>
      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
      <button
        type="submit"
        disabled={status === "sending" || !email.trim()}
        className="h-11 rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
      >
        {status === "sending" ? "送信しています…" : "ログインリンクを送る"}
      </button>
      <p className="text-xs text-text-muted">
        あらかじめメンバーとして招待されたメールアドレス宛にログイン用のリンクを送ります。
      </p>
    </form>
  );
}
