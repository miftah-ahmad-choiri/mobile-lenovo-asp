// stores/statsStore.ts
// Zustand store for WO summary stats.
// Fetched once and shared across all screens — no per-screen re-fetches.

import { create } from "zustand";
import api from "../services/api";

export interface WOStats {
  in_prepare_total:      number;
  cci_followup_total:    number;
  cci_in_transit_total:  number;
  cci_in_repair_total:   number;
  onsite_followup_total: number;
  ons_in_transit_total:  number;
  ons_in_repair_total:   number;
  return_part_total:     number;
  in_return_total:       number;
  [key: string]: number;
}

interface StatsState {
  stats:    WOStats | null;
  loading:  boolean;
  fetch:    () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats:   null,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get<WOStats>("/api/v1/mobile/stats");
      set({ stats: res.data });
    } catch {
      // fail silently — badges just won't show
    } finally {
      set({ loading: false });
    }
  },
}));
