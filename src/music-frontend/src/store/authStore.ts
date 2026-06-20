"use client";

import { create } from "zustand";
import type { User } from "@/types";
import { useFavoritesStore } from "./favoritesStore";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isPro: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user, token });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    useFavoritesStore.getState().clear();
    set({ user: null, token: null });
    if (typeof window !== "undefined") window.location.href = "/";
  },

  isAdmin: () => get().user?.role === "Admin",
  isPro: () =>
    get().user?.role === "UserPro" || get().user?.role === "Admin",
}));
