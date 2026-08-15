// app/login.tsx
// Login screen — posts credentials to /api/v1/auth/login, stores JWT.

import React, { useState, useRef } from "react";
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
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [showPass, setShowPass]   = useState(false);
  const passwordRef               = useRef<TextInput>(null);
  const { setUser }               = useAuthStore();

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });
      await setUser(res.data);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Login failed. Check your credentials and try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password?",
      "Please contact your ASP administrator to reset your password. They can update it from the ASP portal under Staff Management.",
      [{ text: "OK" }]
    );
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
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errorMsg ? styles.inputError : null]}
            value={username}
            onChangeText={(v) => { setUsername(v); setErrorMsg(null); }}
            placeholder="e.g. technician@asp.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.passwordInput, errorMsg ? styles.inputError : null]}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass((p) => !p)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeText}>{showPass ? "🔒" : "🔓"}</Text>
            </TouchableOpacity>
          </View>

          {/* Inline error message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {errorMsg}</Text>
            </View>
          ) : null}

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

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={handleForgotPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
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
  logoText:  { fontSize: 36, fontWeight: "900", fontFamily: "IBMPlexSans_700Bold", color: "#fff" },
  title:     { fontSize: 26, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#fff", letterSpacing: 0.5 },
  subtitle:  { fontSize: 14, fontFamily: "IBMPlexSans_400Regular", color: "#93c5fd", marginTop: 4 },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "IBMPlexSans_600SemiBold",
    color: "#374151",
    marginBottom: 6,
  },
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
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  passwordRow: {
    position: "relative",
    marginBottom: 0,
  },
  passwordInput: {
    paddingRight: 48,
    marginBottom: 0,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 2,
  },
  eyeText: { fontSize: 18 },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "IBMPlexSans_400Regular",
    color: "#dc2626",
    lineHeight: 18,
  },
  btn: {
    backgroundColor: "#e8392e",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  forgotBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: "IBMPlexSans_400Regular",
    color: "#3b82f6",
  },
  footer: {
    textAlign: "center",
    color: "#93c5fd",
    fontSize: 12,
    fontFamily: "IBMPlexSans_400Regular",
    marginTop: 32,
  },
});
