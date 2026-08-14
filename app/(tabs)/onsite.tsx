// app/(tabs)/onsite.tsx
// Standalone ONS Follow-Up page — reached from the Home menu card.
// Shows two sub-tabs: In-Transit (part shipped, not yet received)
//                     In-Repair  (part received, WO still open)

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStats } from "../../hooks/useStats";
import { WOScreen } from "../../components/WOScreen";

const HEADER_BG = "#0d9488";
const ACTIVE    = "#ffffff";
const INACTIVE  = "rgba(255,255,255,0.55)";

type SubTab = "in_transit" | "in_repair";

const SUB_TABS: { key: SubTab; label: string; statsKey: string }[] = [
  { key: "in_transit", label: "🚚  In-Transit", statsKey: "ons_in_transit_total" },
  { key: "in_repair",  label: "🔧  In-Repair",  statsKey: "ons_in_repair_total"  },
];

// ONS uses followup_state=wo_reschedule for in-transit and wo_sla for in-repair
const ONS_STATE_MAP: Record<SubTab, string> = {
  in_transit: "wo_reschedule",
  in_repair:  "wo_sla",
};

export default function OnsiteScreen() {
  const insets              = useSafeAreaInsets();
  const { stats, refetch }  = useStats();
  const [tab, setTab]       = useState<SubTab>("in_transit");

  // Fetch stats if not yet loaded (e.g. navigated here before visiting Home)
  useEffect(() => { if (!stats) refetch(); }, []);

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>ONS Follow-Up</Text>
        <Text style={styles.headerSub}>House Visit</Text>
      </View>

      {/* ── Sub-tab switcher ── */}
      <View style={styles.subTabRow}>
        {SUB_TABS.map((t) => {
          const active = tab === t.key;
          const count  = stats ? (stats[t.statsKey] ?? null) : null;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.subTabBtn, active && styles.subTabBtnActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.75}
            >
              <View style={styles.subTabLabelRow}>
                <Text style={[styles.subTabLabel, active && styles.subTabLabelActive]}>
                  {t.label}
                </Text>
                {count != null && count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {count > 99 ? "99+" : count}
                    </Text>
                  </View>
                )}
              </View>
              {active && <View style={styles.subTabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content — key forces remount on tab switch ── */}
      <WOScreen
        key={tab}
        endpoint="/api/v1/mobile/onsite-followup"
        extraParams={{ followup_state: ONS_STATE_MAP[tab] }}
        emptyText={
          tab === "in_transit"
            ? "No ONS work orders currently in transit."
            : "No ONS work orders currently in repair."
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f4f6" },

  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  headerTitle: { color: "#ffffff", fontSize: 20, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  headerSub:   { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "IBMPlexSans_400Regular" },

  subTabRow: {
    flexDirection: "row",
    backgroundColor: HEADER_BG,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  subTabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  subTabBtnActive: {},
  subTabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subTabLabel: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: INACTIVE,
    letterSpacing: 0.5,
  },
  subTabLabelActive: {
    color: ACTIVE,
  },
  badge: {
    backgroundColor: "#e8392e",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#ffffff",
    lineHeight: 13,
  },
  subTabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },
});
