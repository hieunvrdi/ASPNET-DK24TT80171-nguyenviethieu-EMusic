"use client";

import { create } from "zustand";
import api from "@/lib/axios";
import type { Song, ApiResponse } from "@/types";

interface FavoritesState {
  favoriteIds: Set<number>;
  loaded: boolean;

  loadFavorites: () => Promise<void>;
  toggleFavorite: (songId: number) => Promise<boolean>;
  isFavorite: (songId: number) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: new Set(),
  loaded: false,

  loadFavorites: async () => {
    try {
      const res = await api.get<ApiResponse<Song[]>>("/api/favorites");
      const ids = new Set(res.data.data.map((s) => s.id));
      set({ favoriteIds: ids, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggleFavorite: async (songId: number): Promise<boolean> => {
    const prev = get().favoriteIds;
    const wasFavorite = prev.has(songId);

    // Optimistic update
    const next = new Set(prev);
    if (wasFavorite) next.delete(songId); else next.add(songId);
    set({ favoriteIds: next });

    try {
      await api.post(`/api/favorites/${songId}`);
      return !wasFavorite;
    } catch {
      // Revert
      set({ favoriteIds: prev });
      return wasFavorite;
    }
  },

  isFavorite: (songId: number) => get().favoriteIds.has(songId),

  clear: () => set({ favoriteIds: new Set(), loaded: false }),
}));
