"use client";

import { useCallback, useEffect, useState } from "react";
import { getConversations } from "@/lib/data/conversations";
import type { ConversationRecord } from "@/lib/data/conversations";

export function useConversations(isTest: boolean) {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    getConversations({ isTest }).then((records) => {
      setConversations(records);
      setLoaded(true);
    });
  }, [isTest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conversations, loaded, refresh };
}
