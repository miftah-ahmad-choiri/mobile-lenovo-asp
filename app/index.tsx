// app/index.tsx
// Entry point — reads auth state from SecureStore and redirects accordingly.
// Shows a Lenovo-branded splash while loading.

import { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../stores/authStore";

export default function IndexScreen() {
  const { user, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    // Small delay so the navigator is fully mounted before replacing
    const t = setTimeout(() => {
      if (user) {
        router.replace("/(tabs)/followup/in-prepare");
      } else {
        router.replace("/login");
      }
    }, 100);
    return () => clearTimeout(t);
  }, [isLoading, user]);

  // Splash screen shown while auth loads
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>L</Text>
      </View>
      <Text style={styles.title}>Lenovo ASP</Text>
      <Text style={styles.subtitle}>Work Order Tracker</Text>
      <ActivityIndicator
        size="large"
        color="#e8392e"
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f3460",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#e8392e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoText:  { fontSize: 40, fontWeight: "900", color: "#fff" },
  title:     { fontSize: 28, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  subtitle:  { fontSize: 14, color: "#93c5fd", marginTop: 6, marginBottom: 40 },
  spinner:   { marginTop: 10 },
});
