// app/(tabs)/profile.tsx
// Profile screen — shows ASP info from the JWT payload + logout button.

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";

const HEADER_BG = "#0f3460";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, isLoading, loadUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (!user) loadUser();
  }, []);

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Are you sure you want to sign out?")) return;
      await logout();
      router.replace("/login");
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  if (isLoading || !user) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </View>
    );
  }

  const roleLabel =
    user.role === "asp_user"   ? "ASP Staff User" :
    user.role === "asp"        ? "ASP Account" :
    user.role === "superadmin" ? "Superadmin" : user.role;

  const roleBadgeColor =
    user.role === "superadmin" ? "#7c3aed" : "#e8392e";

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.display_name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{user.display_name}</Text>
          <View style={[styles.roleBadge, { borderColor: roleBadgeColor + "44", backgroundColor: roleBadgeColor + "1a" }]}>
            <Text style={[styles.roleText, { color: roleBadgeColor }]}>{roleLabel}</Text>
          </View>
        </View>

        {/* Account info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <InfoRow label="Username"  value={user.username} />
          <InfoRow label="Email"     value={user.email} />
          <InfoRow label="ASP"       value={user.asp_name} />
          <InfoRow label="Vendor ID" value={user.labor_vendor} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Lenovo ASP Mobile • v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#f3f4f6" },

  // Header
  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerTitle: { color: "#ffffff", fontSize: 20, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },

  scroll:  { flex: 1 },
  content: { padding: 20 },

  // Avatar block
  avatarBox: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: HEADER_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText:  { fontSize: 34, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#fff" },
  displayName: { fontSize: 20, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#111827", marginBottom: 6 },
  roleBadge:   { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  roleText:    { fontSize: 12, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },

  // Info card
  card:      { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 12, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  infoRow:   { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  infoLabel: { fontSize: 13, fontFamily: "IBMPlexSans_400Regular", color: "#6b7280", flex: 1 },
  infoValue: { fontSize: 13, color: "#111827", fontWeight: "500", fontFamily: "IBMPlexSans_500Medium", flex: 2, textAlign: "right" },

  // Logout
  logoutBtn:   { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  logoutText:  { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  versionText: { textAlign: "center", color: "#9ca3af", fontSize: 12, fontFamily: "IBMPlexSans_400Regular", marginTop: 20 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#6b7280", fontSize: 15, fontFamily: "IBMPlexSans_400Regular" },
});
