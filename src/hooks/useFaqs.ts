"use client";

import { useCallback, useEffect, useState } from "react";
import { getDraftFaqs, subscribeFaqs } from "@/lib/data/faqs";
import type { FaqRecord } from "@/lib/data/faqs";

export function useFaqs() {
  const [faqs, setFaqs] = useState<FaqRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    getDraftFaqs().then((records) => {
      setFaqs(records);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
    return subscribeFaqs(refresh);
  }, [refresh]);

  return { faqs, loaded, refresh };
}
