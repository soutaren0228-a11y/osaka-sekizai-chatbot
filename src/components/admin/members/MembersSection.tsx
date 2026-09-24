"use client";

import { useId, useState } from "react";
import { useMembers } from "@/hooks/useMembers";
import { useCanEdit } from "@/hooks/useCanEdit";
import { useSession } from "@/components/admin/SessionProvider";
import {
  changeMemberRole,
  inviteMember,
  removeMember,
  restoreMember,
} from "@/lib/data/members";
import type { MemberRecord, MemberRole } from "@/lib/data/members";
import { useToast } from "@/components/ui/ToastProvider";
import { ReadOnlyNotice } from "@/components/admin/ReadOnlyNotice";

const ROLE_LABELS: Record<MemberRole, string> = {
  editor: "編集できる",
  viewer: "見るだけ",
};

export function MembersSection() {
  const { members, loaded, refresh } = useMembers();
  const canEdit = useCanEdit();
  const { email: myEmail } = useSession();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [submitting, setSubmitting] = useState(false);
  const emailId = useId();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await inviteMember({ email: email.trim(), role });
      setEmail("");
      setRole("editor");
      showToast({ message: `${email.trim()} を招待しました。招待メールが送信されます。` });
      refresh();
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : "招待に失敗しました" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(member: MemberRecord, newRole: MemberRole) {
    await changeMemberRole(member.id, newRole);
    showToast({ message: `${member.email} の権限を「${ROLE_LABELS[newRole]}」にしました。` });
    refresh();
  }

  async function handleRemove(member: MemberRecord) {
    await removeMember(member.id);
    refresh();
    showToast({
      message: `${member.email} を削除しました。`,
      action: {
        label: "元に戻す",
        onClick: async () => {
          await restoreMember(member);
          refresh();
        },
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {!canEdit && <ReadOnlyNotice />}

      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        <h2 className="font-heading text-base font-bold text-text">メンバーを招待</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor={emailId} className="mb-1 block text-sm font-medium text-text">
              メールアドレス
            </label>
            <input
              id={emailId}
              type="email"
              required
              disabled={!canEdit}
              placeholder="example@osaka-sekizai.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-50"
            />
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-text">権限</span>
            <div className="flex h-11 gap-2">
              {(["editor", "viewer"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setRole(r)}
                  aria-pressed={role === r}
                  className={`h-11 rounded-[var(--radius-control)] border px-3 text-sm font-medium disabled:opacity-50 ${
                    role === r ? "border-navy bg-navy-light text-navy" : "border-border bg-bg text-text"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!canEdit || submitting || !email.trim()}
          className="h-11 self-start rounded-[var(--radius-control)] bg-navy px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          {submitting ? "招待しています…" : "招待する"}
        </button>
      </form>

      <section>
        <h2 className="mb-3 font-heading text-base font-bold text-text">メンバー一覧</h2>
        {!loaded ? (
          <p className="text-sm text-text-muted">読み込んでいます…</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text">
                    {member.email}
                    {member.email === myEmail && (
                      <span className="ml-2 rounded-full bg-navy-light px-2 py-0.5 text-xs font-bold text-navy">
                        自分
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">招待日：{new Date(member.invitedAt).toLocaleDateString("ja-JP")}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label htmlFor={`role-${member.id}`} className="sr-only">
                    {member.email}の権限
                  </label>
                  <select
                    id={`role-${member.id}`}
                    value={member.role}
                    disabled={!canEdit || member.isOwner}
                    onChange={(e) => handleRoleChange(member, e.target.value as MemberRole)}
                    className="h-11 rounded-[var(--radius-control)] border border-border bg-bg px-3 text-sm disabled:opacity-50"
                  >
                    <option value="editor">編集できる</option>
                    <option value="viewer">見るだけ</option>
                  </select>
                  {!member.isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={!canEdit}
                      className="h-11 rounded-[var(--radius-control)] border border-danger px-3 text-sm font-medium text-danger hover:bg-danger-light disabled:opacity-50"
                    >
                      削除
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
