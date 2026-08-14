// app/login.tsx
// Login screen — posts credentials to /api/v1/auth/login, stores JWT.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });
      await setUser(res.data);
      router.replace("/(tabs)/followup/in-prepare");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Login failed. Check your credentials and try again.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.title}>Lenovo ASP</Text>
          <Text style={styles.subtitle}>Work Order Tracker</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Username / Email</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. miftah.choiri@ibm.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Lenovo After-Sales Partner Portal</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0f3460" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  header: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#e8392e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: { fontSize: 36, fontWeight: "900", fontFamily: "IBMPlexSans_700Bold", color: "#fff" },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#fff", letterSpacing: 0.5 },
  subtitle: { fontSize: 14, fontFamily: "IBMPlexSans_400Regular", color: "#93c5fd", marginTop: 4 },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  label: { fontSize: 13, fontWeight: "600", fontFamily: "IBMPlexSans_600SemiBold", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "IBMPlexSans_400Regular",
    color: "#1f2937",
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  btn: {
    backgroundColor: "#e8392e",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  footer: {
    textAlign: "center",
    color: "#93c5fd",
    fontSize: 12,
    fontFamily: "IBMPlexSans_400Regular",
    marginTop: 32,
  },
});
