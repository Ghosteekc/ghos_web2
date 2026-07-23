import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import {
  ensureSettingsLoaded,
  getSettingsSnapshot,
  isSettingsLoadedFromServer,
  patchSettings,
  subscribeSettings,
} from "@/stores/settingsStore";
import type { Settings } from "@/types";

export function useSettings() {
  const settings = useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getSettingsSnapshot);
  const [loading, setLoading] = useState(() => !isSettingsLoadedFromServer());

  useEffect(() => {
    let cancelled = false;
    void ensureSettingsLoaded().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    return patchSettings(patch);
  }, []);

  return { settings, loading, update };
}
