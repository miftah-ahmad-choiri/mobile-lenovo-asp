// hooks/useStats.ts
// Thin wrapper around statsStore — re-exports WOStats and exposes the same
// { stats, loading, refetch, followupTotal } shape all screens already use.

import { useStatsStore, WOStats } from "../stores/statsStore";

export type { WOStats };

export function useStats() {
  const { stats, loading, fetch } = useStatsStore();

  const followupTotal =
    (stats?.cci_followup_total ?? 0) +
    (stats?.onsite_followup_total ?? 0);

  return { stats, loading, refetch: fetch, followupTotal };
}
