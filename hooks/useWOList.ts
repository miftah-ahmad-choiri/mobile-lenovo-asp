// hooks/useWOList.ts
// Shared data-fetching hook for all WO list screens.
// Handles loading, pagination, pull-to-refresh, and WO detail fetch.

import { useState, useCallback } from "react";
import api from "../services/api";

export interface WORow {
  work_order_id: number;
  work_order_type?: string;
  work_order_status?: string;
  case_desc?: string;
  contact_name?: string;
  customer?: string;
  created_on?: string;
  committed_delivery_date?: string;
  actual_committed_onsite_date?: string;
  followup_state?: string;
  part_product?: string;
  part_description?: string;
  part_order_date?: string;
  part_eta_wh?: string;
  no_part_lines?: number;
  [key: string]: any;
}

interface ListResult {
  rows: WORow[];
  total: number;
  page: number;
  pages: number;
}

export function useWOList(endpoint: string, extraParams: Record<string, string> = {}) {
  const [rows, setRows]       = useState<WORow[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  const [detailWO, setDetailWO]     = useState<any | null>(null);
  const [detailParts, setDetailParts] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetch = useCallback(
    async (pageNum: number, q: string, isRefresh = false) => {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = {
          page: pageNum,
          per_page: 20,
          q,
          ...extraParams,
        };
        const res = await api.get<ListResult>(endpoint, { params });
        const data = res.data;
        if (pageNum === 1) {
          setRows(data.rows);
        } else {
          setRows((prev) => [...prev, ...data.rows]);
        }
        setTotal(data.total);
        setPage(data.page);
        setPages(data.pages);
      } catch (e: any) {
        setError(e?.response?.data?.error || "Failed to load data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [endpoint, JSON.stringify(extraParams)]
  );

  const refresh = useCallback(() => fetch(1, search, true), [fetch, search]);

  const loadMore = useCallback(() => {
    if (!loading && page < pages) fetch(page + 1, search);
  }, [loading, page, pages, fetch, search]);

  const onSearch = useCallback(
    (q: string) => {
      setSearch(q);
      setPage(1);
      fetch(1, q);
    },
    [fetch]
  );

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
    rows, total, page, pages, loading, refreshing, error, search,
    fetch, refresh, loadMore, onSearch,
    detailWO, detailParts, detailVisible, detailLoading,
    openDetail, closeDetail,
  };
}
