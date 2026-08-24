import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import { cacheInvalidate } from "@/api/cache";
import type { ProPlan, ProStatus } from "@/types";

export interface GhosteekPro {
  isPro: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
  planId: string | null;
  expired: boolean;
  trialUsed: boolean;
  plans: ProPlan[];
  status: ProStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Single source of truth for Ghosteek Pro state in the Mini App. */
export function useGhosteekPro(): GhosteekPro {
  const [status, setStatus] = useState<ProStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (fresh = false) => {
    try {
      setError(null);
      // Profile carries the same subscription block — keep both views in sync.
      if (fresh) cacheInvalidate("profile-v8");
      setStatus(await api.getProStatus(fresh ? { fresh: true } : undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить статус Ghosteek Pro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await load(true);
  }, [load]);

  return {
    isPro: status?.is_pro ?? false,
    expiresAt: status?.expires_at ?? null,
    daysLeft: status?.days_left ?? null,
    planId: status?.plan_id ?? null,
    expired: status?.expired ?? false,
    trialUsed: status?.trial_used ?? false,
    plans: status?.plans ?? [],
    status,
    loading,
    error,
    refresh,
  };
}
