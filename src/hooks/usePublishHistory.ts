"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublishHistory, subscribePublishHistory } from "@/lib/data/publishHistory";
import type { PublishVersion } from "@/lib/data/publishHistory";

export function usePublishHistory() {
  const [versions, setVersions] = useState<PublishVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    getPublishHistory().then((records) => {
      setVersions(records);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
    return subscribePublishHistory(refresh);
  }, [refresh]);

  return { versions, loaded, refresh };
}
