"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import api from "@/lib/axios";
import type { User, ApiResponse } from "@/types";

export default function AuthInitializer() {
  const setAuth       = useAuthStore((s) => s.setAuth);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);

  useEffect(() => {
    const token  = localStorage.getItem("token");
    const stored = localStorage.getItem("user");

    if (!token) return;

    // Restore from localStorage immediately (no flicker)
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        setAuth(user, token);
      } catch {}
    }

    // Validate token with server — also loads favorites on success
    api
      .get<ApiResponse<User>>("/api/auth/me")
      .then((res) => {
        if (res.data.success) {
          setAuth(res.data.data, token);
          loadFavorites();
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  }, [setAuth, loadFavorites]);

  return null;
}
