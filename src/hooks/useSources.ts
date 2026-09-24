"use client";

import { useCallback, useEffect, useState } from "react";
import { getSources, subscribeSources } from "@/lib/data/sources";
import type { SourceRecord } from "@/lib/data/types";

export function useSources() {
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    getSources().then((records) => {
      setSources(records);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
    return subscribeSources(refresh);
  }, [refresh]);

  return { sources, loaded, refresh };
}
