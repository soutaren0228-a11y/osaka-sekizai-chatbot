"use client";

import { useCallback, useEffect, useState } from "react";
import { getUnansweredQuestions } from "@/lib/data/unanswered";
import type { UnansweredEntry } from "@/lib/data/unanswered";

const POLL_INTERVAL_MS = 15_000;

export function useUnanswered() {
  const [entries, setEntries] = useState<UnansweredEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    getUnansweredQuestions().then((records) => {
      setEntries(records);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { entries, loaded, refresh };
}
