// app/(tabs)/followup/_layout.tsx
// Custom header for Follow-Up sub-screens.
// The parent tab bar hides its header for this tab (headerShown: false in tabs _layout).
// This Stack renders one clean header: dark blue title bar + white tab switcher row
// with per-tab WO counts shown alongside each label.

import { Stack, usePathname, router } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStats } from "../../../hooks/useStats";

const HEADER_BG = "#0f3460";
const TAB_BG    = "#ffffff";
const ACTIVE    = "#e8392e";
const INACTIVE  = "#9ca3af";

const TABS = [
  { label: "PREP", route: "/(tabs)/followup/in-prepare", match: "in-prepare", full: "In-Prepare",    statsKey: "in_prepare_total"     },
  { label: "CCI",  route: "/(tabs)/followup/cci",        match: "cci",         full: "CCI Follow-Up", statsKey: "cci_followup_total"    },
  { label: "ONS",  route: "/(tabs)/followup/onsite",     match: "onsite",      full: "ONS Follow-Up", statsKey: "onsite_followup_total" },
];

function FollowupHeader() {
  const path       = usePathname();
  const insets     = useSafeAreaInsets();
  const activeTab  = TABS.find(t => path.includes(t.match)) ?? TABS[0];
  const { stats }  = useStats();

  return (
    <View>
      {/* Dark blue title bar — padded below status bar */}
      <View style={[styles.titleBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.titleText}>{activeTab.full}</Text>
      </View>

      {/* White tab switcher row */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = tab.match === activeTab.match;
          const count  = stats ? (stats[tab.statsKey] ?? 0) : null;
          return (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabBtn}
              onPress={() => router.replace(tab.route as any)}
              activeOpacity={0.75}
            >
              <View style={styles.tabLabelRow}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {count != null && count > 0 && (
                  <View style={[styles.countPill, active && styles.countPillActive]}>
                    <Text style={[styles.countPillText, active && styles.countPillTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </View>
              {active && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titleText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: TAB_BG,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: INACTIVE,
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: ACTIVE,
  },
  countPill: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  countPillActive: {
    backgroundColor: ACTIVE + "1a",
    borderColor: ACTIVE + "44",
  },
  countPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: INACTIVE,
  },
  countPillTextActive: {
    color: ACTIVE,
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    borderRadius: 2,
    backgroundColor: ACTIVE,
  },
});

export default function FollowupLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <FollowupHeader />,
        headerStatusBarHeight: 0,   // we handle status bar padding manually with insets
      } as any}
    >
      <Stack.Screen name="in-prepare" />
      <Stack.Screen name="cci" />
      <Stack.Screen name="onsite" />
    </Stack>
  );
}
