"use client";

import { useSession } from "@/components/admin/SessionProvider";

/** 今ログインしているメンバーの権限で編集操作ができるかどうか（「見るだけ」ならfalse） */
export function useCanEdit(): boolean {
  const { role } = useSession();
  return role === "editor";
}
