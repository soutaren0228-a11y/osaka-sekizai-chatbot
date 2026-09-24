"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSources } from "@/lib/data/sources";
import type { SourceRecord } from "@/lib/data/types";

const POLL_INTERVAL_MS = 2000;

/**
 * 取り込みはサーバー側でバックグラウンド実行されるため、
 * 「読み込み中」の項目がある間は自動的に再取得して進捗を反映する。
 */
export function useSources() {
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    getSources().then((records) => {
      setSources(records);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const hasLoading = sources.some((s) => s.status === "loading");
    if (!hasLoading) return;

    timerRef.current = setTimeout(refresh, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sources, refresh]);

  return { sources, loaded, refresh };
}
