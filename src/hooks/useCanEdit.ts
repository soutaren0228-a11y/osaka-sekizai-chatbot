"use client";

import { useCallback, useEffect, useState } from "react";
import { getViewerRole, subscribeViewerRole } from "@/lib/data/viewerRole";
import type { MemberRole } from "@/lib/data/members";

/** 今の自分の権限で編集操作ができるかどうか（「見るだけ」なら false） */
export function useCanEdit(): boolean {
  const [role, setRole] = useState<MemberRole>("editor");

  const refresh = useCallback(() => {
    getViewerRole().then(setRole);
  }, []);

  useEffect(() => {
    refresh();
    return subscribeViewerRole(refresh);
  }, [refresh]);

  return role === "editor";
}
