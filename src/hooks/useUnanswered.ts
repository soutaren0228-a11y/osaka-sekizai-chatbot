"use client";

import { useCallback, useEffect, useState } from "react";
import { getUnansweredQuestions, subscribeUnanswered } from "@/lib/data/unanswered";
import type { UnansweredEntry } from "@/lib/data/unanswered";

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
    return subscribeUnanswered(refresh);
  }, [refresh]);

  return { entries, loaded, refresh };
}
