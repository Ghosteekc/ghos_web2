import { useEffect } from "react";

import { ensureSettingsLoaded } from "@/stores/settingsStore";

/** Load persisted settings once when the shell mounts. */
export function useHapticSettingsBootstrap() {
  useEffect(() => {
    void ensureSettingsLoaded();
  }, []);
}
