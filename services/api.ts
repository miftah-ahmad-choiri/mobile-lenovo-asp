// services/api.ts
// Axios instance that auto-attaches the JWT stored in SecureStore.
//
// BASE_URL selection:
//   - Web browser (localhost)  → http://localhost:5000
//   - Phone / device           → http://192.168.1.6:5000  (PC's LAN IP)
//   - Production build         → https://app.ticket-asp.my.id
//
// To switch to production: comment out the dev block and uncomment PROD.

import { Platform } from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// ── URL config ────────────────────────────────────────────────────────────────
const DEV_WEB    = "http://localhost:5000";       // browser on same PC
const DEV_DEVICE = "http://192.168.1.6:5000";     // phone on same Wi-Fi
// const PROD    = "https://app.ticket-asp.my.id"; // production — uncomment when deploying

export const BASE_URL = Platform.OS === "web" ? DEV_WEB : DEV_DEVICE;
// export const BASE_URL = PROD;

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT Bearer token to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    if (Platform.OS === "web") {
      token = localStorage.getItem("jwt_token");
    } else {
      token = await SecureStore.getItemAsync("jwt_token");
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore storage errors
  }
  return config;
});

export default api;
