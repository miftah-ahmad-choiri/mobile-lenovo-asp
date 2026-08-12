// stores/authStore.ts
// Zustand store for authentication state.
// Persists the JWT and user info using SecureStore (phone) or localStorage (web).

import { Platform } from "react-native";
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export interface AuthUser {
  token: string;
  role: string;
  display_name: string;
  username: string;
  email: string | null;
  labor_vendor: string | null;
  asp_name: string;
}

// ── Storage helpers — SecureStore on device, localStorage on web ──────────────
async function saveItem(key: string, value: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: async (user) => {
    await saveItem("jwt_token", user.token);
    await saveItem("auth_user", JSON.stringify(user));
    set({ user });
  },

  loadUser: async () => {
    try {
      const raw = await getItem("auth_user");
      if (raw) {
        set({ user: JSON.parse(raw), isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  logout: async () => {
    await removeItem("jwt_token");
    await removeItem("auth_user");
    set({ user: null });
  },
}));
