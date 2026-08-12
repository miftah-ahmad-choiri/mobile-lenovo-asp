// app/(tabs)/_layout.tsx
// 3-tab bottom navigation: Follow-Up | Return Part | Profile

import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStats } from "../../hooks/useStats";

const TAB_ACTIVE   = "#e8392e";
const TAB_INACTIVE = "#9ca3af";
const TAB_BG       = "#ffffff";
const BORDER_COLOR = "#e5e7eb";

interface TabIconProps {
  emoji: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ emoji, focused, badge }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 36,
    borderRadius: 10,
    marginTop: 2,
  },
  iconWrapActive: {
    backgroundColor: "rgba(232,57,46,0.18)",
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TAB_ACTIVE,
    marginTop: 1,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: TAB_ACTIVE,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 13,
  },
});

export default function TabsLayout() {
  const insets      = useSafeAreaInsets();
  const { stats, followupTotal } = useStats();
  const returnTotal = stats?.return_part_total ?? 0;

  // Extra padding above Android navigation bar (back/home/menu)
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: TAB_BG },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: BORDER_COLOR,
          borderTopWidth: 1,
          height: 56 + bottomPad,
          paddingBottom: Math.max(bottomPad - 8, 4),
          paddingTop: 6,
          elevation: 0,
        },
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="followup"
        options={{
          title: "Follow-Up",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" focused={focused} badge={followupTotal} />
          ),
        }}
      />
      <Tabs.Screen
        name="return-part"
        options={{
          title: "Return Part",
          headerTitle: "Return Part",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📦" focused={focused} badge={returnTotal} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "My Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
