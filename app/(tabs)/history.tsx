// app/(tabs)/history.tsx
// History screen — shows last 7 days of completed/closed WOs for this ASP.
// Groups rows by closing/completion date with date-section headers.
// Day-filter pills (1 / 3 / 7 days) let the user narrow the window.

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHistory, HistoryWO } from "../../hooks/useHistory";
import { WODetailSheet } from "../../components/WODetailSheet";

const HEADER_BG = "#0f3460";
const ACCENT    = "#e8392e";

// ── Day-filter pills ──────────────────────────────────────────────────────────
const DAY_OPTIONS = [1, 3, 7, 30] as const;
type DayOption = typeof DAY_OPTIONS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────
function closedDate(wo: HistoryWO): string {
  return (wo.closing_date || wo.completion_date || wo.created_on || "").slice(0, 10);
}

function formatSectionDate(dateStr: string): string {
  if (!dateStr) return "Unknown Date";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.getTime() === today.getTime())     return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// ── WO type badge ─────────────────────────────────────────────────────────────
function woTypeLabel(wo: HistoryWO) {
  return wo.work_order_type?.toUpperCase().includes("ONSITE") ? "ONS" : "CCI";
}
function woTypeColor(wo: HistoryWO) {
  return woTypeLabel(wo) === "ONS" ? "#d97706" : "#2563ab";
}

// ── Single history row card ───────────────────────────────────────────────────
function HistoryCard({ wo, onPress }: { wo: HistoryWO; onPress: () => void }) {
  const typeTag   = woTypeLabel(wo);
  const typeColor = woTypeColor(wo);
  const closed    = closedDate(wo);
  const status    = wo.work_order_status || "Closed";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Green left accent = completed */}
      <View style={styles.cardAccentBar} />

      <View style={styles.cardInner}>
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <Text style={styles.woNum}>#{wo.work_order_id}</Text>
          <View style={[styles.tag, { backgroundColor: typeColor + "22", borderColor: typeColor }]}>
            <Text style={[styles.tagText, { color: typeColor }]}>{typeTag}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>✓ {status}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.caseDesc} numberOfLines={2}>
          {wo.case_desc || "No description"}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {wo.contact_name ? (
            <Text style={styles.metaText} numberOfLines={1}>👤 {wo.contact_name}</Text>
          ) : null}
          {wo.serial_number ? (
            <Text style={styles.metaText} numberOfLines={1}>🔖 {wo.serial_number}</Text>
          ) : null}
        </View>

        {/* Dates footer */}
        <View style={styles.datesRow}>
          <Text style={styles.dateText}>Created: {(wo.created_on || "—").slice(0, 10)}</Text>
          <Text style={styles.dateText}>Closed: {closed || "—"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCountPill}>
        <Text style={styles.sectionCountText}>{count}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const insets          = useSafeAreaInsets();
  const [days, setDays] = useState<DayOption>(7);

  const {
    rows, total, loading, refreshing, error, search,
    refresh, onSearch,
    detailWO, detailParts, detailVisible, detailLoading,
    openDetail, closeDetail,
  } = useHistory(days);

  // Group rows by closing date into SectionList sections
  const sections = useMemo(() => {
    const map = new Map<string, HistoryWO[]>();
    for (const wo of rows) {
      const key = closedDate(wo) || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(wo);
    }
    // Sort newest date first
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ title: date, data }));
  }, [rows]);

  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={styles.root}>
      {/* ── Header bar ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>Last {days} day{days > 1 ? "s" : ""}</Text>
      </View>

      {/* ── Day-filter pills ── */}
      <View style={styles.filterRow}>
        {DAY_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.filterPill, days === d && styles.filterPillActive]}
            onPress={() => setDays(d)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, days === d && styles.filterPillTextActive]}>
              {d === 1 ? "Today" : `${d} Days`}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterTotal}>
          <Text style={styles.filterTotalText}>{total} WO{total !== 1 ? "s" : ""}</Text>
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search WO #, serial, contact..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={onSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Error state ── */}
      {error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading && rows.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={HEADER_BG} />
        </View>
      ) : !loading && rows.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No completed work orders{"\n"}in the last {days} day{days > 1 ? "s" : ""}.</Text>
        </View>
      ) : (
        /* ── Section list ── */
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.work_order_id)}
          renderItem={({ item }) => (
            <HistoryCard wo={item} onPress={() => openDetail(item.work_order_id)} />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={formatSectionDate(section.title)}
              count={section.data.length}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={HEADER_BG} />
          }
          contentContainerStyle={{ paddingBottom: bottomPad + 12 }}
          stickySectionHeadersEnabled
        />
      )}

      {/* ── WO detail sheet ── */}
      <WODetailSheet
        visible={detailVisible}
        wo={detailWO}
        parts={detailParts}
        onClose={closeDetail}
      />

      {detailLoading ? (
        <View style={styles.detailLoader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f4f6" },

  // Header
  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  headerTitle: { color: "#ffffff", fontSize: 20, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  headerSub:   { color: "#93c5fd", fontSize: 13, fontFamily: "IBMPlexSans_400Regular" },

  // Day filter
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 8,
  },
  filterPill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "#f9fafb",
  },
  filterPillActive: {
    backgroundColor: HEADER_BG,
    borderColor: HEADER_BG,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#6b7280",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  filterTotal: { marginLeft: "auto" },
  filterTotalText: { fontSize: 12, color: "#6b7280", fontWeight: "600", fontFamily: "IBMPlexSans_600SemiBold" },

  // Search
  searchBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    fontFamily: "IBMPlexSans_400Regular",
    color: "#111827",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#374151",
  },
  sectionCountPill: {
    backgroundColor: HEADER_BG + "18",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: HEADER_BG,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardAccentBar: {
    width: 4,
    backgroundColor: "#16a34a",
  },
  cardInner: { flex: 1, padding: 13 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 5,
  },
  woNum:       { fontSize: 15, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#0f3460", flex: 1 },
  tag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  statusBadge: {
    backgroundColor: "#16a34a1a",
    borderWidth: 1,
    borderColor: "#16a34a44",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#16a34a" },
  caseDesc: { fontSize: 13, fontFamily: "IBMPlexSans_400Regular", color: "#374151", marginBottom: 4, lineHeight: 18 },
  metaRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  metaText: { fontSize: 12, fontFamily: "IBMPlexSans_400Regular", color: "#6b7280", flexShrink: 1 },
  datesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  dateText: { fontSize: 11, fontFamily: "IBMPlexSans_400Regular", color: "#9ca3af" },

  // States
  centerBox:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji:  { fontSize: 40, marginBottom: 12 },
  emptyText:   { color: "#6b7280", fontFamily: "IBMPlexSans_400Regular", textAlign: "center", fontSize: 15, lineHeight: 22 },
  errorText:   { color: "#dc2626", fontFamily: "IBMPlexSans_400Regular", textAlign: "center", marginBottom: 12 },
  retryBtn:    { backgroundColor: HEADER_BG, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText:   { color: "#fff", fontWeight: "600", fontFamily: "IBMPlexSans_600SemiBold" },
  detailLoader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});
