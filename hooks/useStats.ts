// hooks/useStats.ts
// Fetches WO summary stats from /api/v1/mobile/stats.
// Shared across the tab layout to power badge counts and summary cards.

import { useState, useCallback, useEffect } from "react";
import api from "../services/api";

export interface WOStats {
  in_prepare_total:    number;
  cci_followup_total:  number;
  onsite_followup_total: number;
  return_part_total:   number;
  [key: string]: number;
}

export function useStats() {
  const [stats, setStats]     = useState<WOStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<WOStats>("/api/v1/mobile/stats");
      setStats(res.data);
    } catch {
      // fail silently — badges just won't show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, []);

  const followupTotal =
    (stats?.in_prepare_total ?? 0) +
    (stats?.cci_followup_total ?? 0) +
    (stats?.onsite_followup_total ?? 0);

  return { stats, loading, refetch: fetch, followupTotal };
}
