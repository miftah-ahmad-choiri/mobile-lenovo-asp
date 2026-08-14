// app/(tabs)/home.tsx
// Home screen — 2×2 grid of icon cards, each with a badge count.

import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStats } from "../../hooks/useStats";

const HEADER_BG  = "#0f3460";
const ACCENT_RED = "#e8392e";
const CARD_BG    = "#ffffff";

const MENUS: {
  title:    string;
  emoji:    string;
  bgColor:  string;
  route:    string;
  statsKey: string;
}[] = [
  {
    title:   "CCI Follow-Up",
    emoji:   "🏪",
    bgColor: "#f5f3ff",
    route:   "/(tabs)/cci",
    statsKey: "cci_followup_total",
  },
  {
    title:   "ONS Follow-Up",
    emoji:   "🏡",
    bgColor: "#fef2f2",
    route:   "/(tabs)/onsite",
    statsKey: "onsite_followup_total",
  },
  {
    title:   "In-Prepare",
    emoji:   "📋",
    bgColor: "#fef2f2",
    route:   "/(tabs)/in-prepare",
    statsKey: "in_prepare_total",
  },
  {
    title:   "In-Return",
    emoji:   "📦",
    bgColor: "#fffbeb",
    route:   "/(tabs)/in-return",
    statsKey: "in_return_total",
  },
];

// ── Single grid card ──────────────────────────────────────────────────────────
interface CardProps {
  title:   string;
  emoji:   string;
  bgColor: string;
  badge:   number | null;
  onPress: () => void;
}

function MenuCard({ title, emoji, bgColor, badge, onPress }: CardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {/* Icon box */}
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Text style={styles.emoji}>{emoji}</Text>

        {/* Badge — top-right corner of icon box */}
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>

      {/* Label */}
      <Text style={styles.cardLabel} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets              = useSafeAreaInsets();
  const { stats, refetch }  = useStats();

  // Fetch stats on mount (and whenever Home is revisited) so all screens
  // that read from the shared statsStore see up-to-date counts.
  useEffect(() => { refetch(); }, []);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Home</Text>
        <Text style={styles.headerBell}>🔔</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLogoText}>Lenovo</Text>
            <Text style={styles.heroSub}>Start your effective day{"\n"}with Ticketing System</Text>
          </View>
          <View style={styles.heroAccent}>
            <Text style={styles.heroAccentText}>LENOVO</Text>
          </View>
        </View>

        {/* Section heading */}
        <Text style={styles.sectionLabel}>Select Category</Text>

        {/* 2×2 grid */}
        <View style={styles.grid}>
          {MENUS.map((menu) => (
            <MenuCard
              key={menu.route}
              title={menu.title}
              emoji={menu.emoji}
              bgColor={menu.bgColor}
              badge={stats ? (stats[menu.statsKey] ?? 0) : null}
              onPress={() => router.push(menu.route as any)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#f3f4f6" },

  // Header
  header: {
    backgroundColor: HEADER_BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerTitle: { color: "#ffffff", fontSize: 20, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  headerBell:  { fontSize: 20, fontFamily: "IBMPlexSans_400Regular" },

  // Hero banner
  heroBanner: {
    margin: 14,
    borderRadius: 14,
    backgroundColor: "#1a1a2e",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 100,
    paddingLeft: 18,
  },
  heroTextBlock:  { flex: 1, paddingVertical: 20 },
  heroLogoText:   { color: ACCENT_RED, fontSize: 22, fontWeight: "900", fontFamily: "IBMPlexSans_700Bold", letterSpacing: 0.5 },
  heroSub:        { color: "#ffffff", fontSize: 13, fontFamily: "IBMPlexSans_400Regular", marginTop: 4, lineHeight: 19 },
  heroAccent:     { backgroundColor: ACCENT_RED, paddingHorizontal: 10, paddingVertical: 60, alignItems: "center", justifyContent: "center" },
  heroAccentText: { color: "#ffffff", fontSize: 11, fontWeight: "900", fontFamily: "IBMPlexSans_700Bold", letterSpacing: 2, transform: [{ rotate: "90deg" }], width: 70, textAlign: "center" },

  // Section
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#6b7280",
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 12,
    textTransform: "uppercase",
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 16,
  },

  // Card — square tile
  card: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Icon box inside card
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    position: "relative",
  },
  emoji: { fontSize: 36 },

  // Badge — top-right of icon box
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: ACCENT_RED,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: CARD_BG,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", fontFamily: "IBMPlexSans_700Bold", lineHeight: 14 },

  // Label below icon
  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#111827",
    textAlign: "center",
    lineHeight: 18,
  },

  scrollContent: { paddingBottom: 32 },
});
