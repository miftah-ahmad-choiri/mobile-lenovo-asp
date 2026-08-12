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
import { useAuthStore } from "../../stores/authStore";

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
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    // Alert.alert doesn't work on web — use confirm() instead
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

  if (!user) return null;

  const roleLabel =
    user.role === "asp_user"   ? "ASP Staff User" :
    user.role === "asp"        ? "ASP Account" :
    user.role === "superadmin" ? "Superadmin" : user.role;

  const roleBadgeColor =
    user.role === "superadmin" ? "#7c3aed" : "#e8392e";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content:   { padding: 20, paddingBottom: 40 },
  avatarBox: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0f3460",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText:   { fontSize: 34, fontWeight: "700", color: "#fff" },
  displayName:  { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  roleBadge:    { backgroundColor: "#e8392e1a", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: "#e8392e44" },
  roleText:     { fontSize: 12, fontWeight: "700", color: "#e8392e" },
  card:         { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardTitle:    { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  infoRow:      { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  infoLabel:    { fontSize: 13, color: "#6b7280", flex: 1 },
  infoValue:    { fontSize: 13, color: "#111827", fontWeight: "500", flex: 2, textAlign: "right" },
  logoutBtn:    { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  logoutText:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  versionText:  { textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 20 },
});
