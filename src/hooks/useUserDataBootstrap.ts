import { useEffect, useRef } from "react";
import { api } from "@/api/client";
import { cacheHas } from "@/api/cache";

const BOOTSTRAP_KEY = "ghosteek-data-bootstrap-tag";

/**
 * On Mini App open: if the user is linked and battles are not cached yet,
 * force one CR sync so History / Analytics / Mine decks are not empty.
 */
export function useUserDataBootstrap() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const profile = await api.getProfile({ fresh: true });
        const tag = (profile.player_tag || "").trim();
        if (!tag) return;

        const doneFor = sessionStorage.getItem(BOOTSTRAP_KEY);
        const battlesWarm = cacheHas("battles-v5") || cacheHas("home-v3");
        if (doneFor === tag && battlesWarm) return;

        await api.syncData();
        sessionStorage.setItem(BOOTSTRAP_KEY, tag);
        window.dispatchEvent(new Event("app:sync"));
      } catch {
        // Keep UI usable; pages still load via their own endpoints.
      }
    })();
  }, []);
}
