"use client";

import { useCallback, useEffect, useState } from "react";
import { getDraftChanges } from "@/lib/data/publishState";
import type { DraftChange } from "@/lib/data/publishState";

export function usePendingChanges() {
  const [changes, setChanges] = useState<DraftChange[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    getDraftChanges().then((records) => {
      setChanges(records);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { changes, count: changes.length, loaded, refresh };
}
