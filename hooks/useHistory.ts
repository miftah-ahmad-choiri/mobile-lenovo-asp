// hooks/useHistory.ts
// Fetches last N days of completed/closed WOs from /api/v1/mobile/history.

import { useState, useCallback, useEffect } from "react";
import api from "../services/api";

export interface HistoryWO {
  work_order_id: number;
  work_order_type?: string;
  work_order_status?: string;
  case_desc?: string;
  contact_name?: string;
  customer?: string;
  serial_number?: string;
  product_description?: string;
  product_id_mtm?: string;
  city?: string;
  mobile_phone?: string;
  primary_email?: string;
  created_on?: string;
  committed_delivery_date?: string;
  actual_committed_onsite_date?: string;
  completion_date?: string;
  closing_date?: string;
  followup_state?: string;
  [key: string]: any;
}

export interface HistoryResult {
  rows: HistoryWO[];
  total: number;
  days: number;
}

export function useHistory(days: number) {
  const [rows, setRows]       = useState<HistoryWO[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  const [detailWO, setDetailWO]         = useState<any | null>(null);
  const [detailParts, setDetailParts]   = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async (q: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await api.get<HistoryResult>("/api/v1/mobile/history", {
        params: { days, q: q || undefined },
      });
      setRows(res.data.rows);
      setTotal(res.data.total);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to load history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => { fetchData(search); }, [fetchData]);

  const refresh   = useCallback(() => fetchData(search, true), [fetchData, search]);
  const onSearch  = useCallback((q: string) => { setSearch(q); fetchData(q); }, [fetchData]);

  const openDetail = useCallback(async (woId: number) => {
    setDetailLoading(true);
    setDetailVisible(true);
    setDetailWO(null);
    setDetailParts([]);
    try {
      const res = await api.get(`/api/v1/mobile/wo/${woId}`);
      setDetailWO(res.data.wo);
      setDetailParts(res.data.parts || []);
    } catch {
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailVisible(false);
    setDetailWO(null);
    setDetailParts([]);
  }, []);

  return {
    rows, total, loading, refreshing, error, search,
    refresh, onSearch,
    detailWO, detailParts, detailVisible, detailLoading,
    openDetail, closeDetail,
  };
}
