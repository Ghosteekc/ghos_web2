import { useEffect, useRef } from "react";
import { api } from "@/api/client";
import {
  getTelegramInitData,
  isTelegramMiniApp,
  onTelegramAuthReady,
  waitForTelegramInitData,
} from "@/utils/telegramAuth";

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

      void (async () => {
        if (isTelegramMiniApp() && !getTelegramInitData()) {
          await waitForTelegramInitData({ maxWaitMs: 5000, forceReady: true });
          if (!getTelegramInitData()) return;
        }
        if (busy.current) return;
        busy.current = true;
        try {
          await api.getProfile({ fresh: true });
        } catch {
          /* keep cached profile */
        } finally {
          busy.current = false;
        }
      })();
    };

    check();
    const offAuth = onTelegramAuthReady(check);
    const onFocus = () => check();
    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      offAuth();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
