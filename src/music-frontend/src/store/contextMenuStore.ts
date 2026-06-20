"use client";

import { create } from "zustand";
import type { Song } from "@/types";

interface ContextMenuState {
  visible: boolean;
  song: Song | null;
  songQueue: Song[];
  x: number;
  y: number;

  open: (song: Song, songQueue: Song[], rawX: number, rawY: number) => void;
  close: () => void;
}

const MENU_W   = 224;
const MENU_H   = 300; // estimated max height

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  visible: false,
  song: null,
  songQueue: [],
  x: 0,
  y: 0,

  open: (song, songQueue, rawX, rawY) => {
    const vw = typeof window !== "undefined" ? window.innerWidth  : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    const x  = Math.max(8, Math.min(rawX, vw - MENU_W - 8));
    const y  = Math.max(8, Math.min(rawY, vh - MENU_H - 8));
    set({ visible: true, song, songQueue, x, y });
  },

  close: () => set({ visible: false }),
}));
