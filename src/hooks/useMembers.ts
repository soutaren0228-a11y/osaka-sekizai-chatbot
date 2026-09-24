"use client";

import { useCallback, useEffect, useState } from "react";
import { getMembers, subscribeMembers } from "@/lib/data/members";
import type { MemberRecord } from "@/lib/data/members";

export function useMembers() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    getMembers().then((records) => {
      setMembers(records);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
    return subscribeMembers(refresh);
  }, [refresh]);

  return { members, loaded, refresh };
}
