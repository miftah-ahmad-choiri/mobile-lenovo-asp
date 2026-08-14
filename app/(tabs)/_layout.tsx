// app/(tabs)/_layout.tsx
// Bottom navigation: Home | History | Profile

import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ACTIVE   = "#e8392e";
const TAB_INACTIVE = "#9ca3af";
const TAB_BG       = "#ffffff";
const BORDER_COLOR = "#e5e7eb";

interface TabIconProps {
  name: React.ComponentProps<typeof Feather>["name"];
  focused: boolean;
  badge?: number;
}

function TabIcon({ name, focused, badge }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Feather
        name={name}
        size={22}
        color={focused ? TAB_ACTIVE : TAB_INACTIVE}
      />
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
  const insets = useSafeAreaInsets();

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
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clock" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="user" focused={focused} />
          ),
        }}
      />
      {/* These screens are navigated to from the Home menu cards, not shown as tabs */}
      <Tabs.Screen
        name="cci"
        options={{
          headerTitle: "CCI Follow-Up",
          headerStyle: { backgroundColor: "#0891b2" },
          headerTintColor: "#ffffff",
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="onsite"
        options={{
          headerTitle: "ONS Follow-Up",
          headerStyle: { backgroundColor: "#d97706" },
          headerTintColor: "#ffffff",
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="in-prepare"
        options={{
          title: "In-Prepare",
          headerTitle: "In-Prepare",
          headerStyle: { backgroundColor: "#0f3460" },
          headerTintColor: "#ffffff",
          href: null,
        }}
      />
      <Tabs.Screen
        name="in-return"
        options={{
          title: "In-Return",
          headerTitle: "Return Part",
          headerStyle: { backgroundColor: "#7c3aed" },
          headerTintColor: "#ffffff",
          href: null,
        }}
      />
    </Tabs>
  );
}
