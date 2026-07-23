import { useEffect } from "react";

import { api } from "@/api/client";
import { setHapticEnabled } from "@/utils/hapticManager";

/** Load persisted haptic preference once when the shell mounts. */
export function useHapticSettingsBootstrap() {
  useEffect(() => {
    let cancelled = false;
    api
      .getSettings()
      .then((settings) => {
        if (!cancelled) {
          setHapticEnabled(settings.haptic_enabled);
        }
      })
      .catch(() => {
        /* keep default (enabled) */
      });
    return () => {
      cancelled = true;
    };
  }, []);
}
