"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDraftAppearance,
  getPublishedAppearance,
  resolveAccentColor,
  type AppearanceSettings,
} from "@/lib/data/appearance";
import type { ChatConfig } from "@/components/chat/types";

function toChatConfig(settings: AppearanceSettings): ChatConfig {
  return {
    botName: settings.botName,
    launcherLabel: settings.launcherLabel,
    greeting: settings.greeting,
    suggestions: settings.suggestions,
    disclaimer: settings.disclaimer,
    accentColor: resolveAccentColor(settings),
    iconDataUrl: settings.iconDataUrl,
    position: settings.position,
  };
}

/** チャットの見た目設定を読み込む。isTest=trueなら下書き、falseなら公開版を見る */
export function useChatConfig(isTest: boolean): ChatConfig | null {
  const [config, setConfig] = useState<ChatConfig | null>(null);

  const refresh = useCallback(() => {
    (isTest ? getDraftAppearance() : getPublishedAppearance()).then((settings) => {
      setConfig(toChatConfig(settings));
    });
  }, [isTest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return config;
}
