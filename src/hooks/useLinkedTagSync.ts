import { useEffect, useRef } from "react";
import { api } from "@/api/client";

/**
 * After bot /link (or Settings unlink + re-link), Mini App may still hold
 * battles/stats caches. Re-check /api/me on focus/visibility and wipe caches
 * when player_tag changes (see applyLinkedPlayerTag).
 */
export function useLinkedTagSync() {
  const busy = useRef(false);

  useEffect(() => {
    const check = () => {
      if (busy.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      busy.current = true;
      void api
        .getProfile({ fresh: true })
        .catch(() => undefined)
        .finally(() => {
          busy.current = false;
        });
    };

    check();
    const onFocus = () => check();
    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
