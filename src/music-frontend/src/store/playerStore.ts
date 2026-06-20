"use client";

import { create } from "zustand";
import type { Song } from "@/types";

// Module-level Audio element — NOT React state (prevents re-renders)
let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio && typeof window !== "undefined") {
    audio = new Audio();
    audio.preload = "metadata";
  }
  return audio!;
}

// ── Play-count tracking (15-second rule) ─────────────────────────────────────
// Accumulated real playback time for the current song (not wall-clock time).
// Resets when song changes. Fires POST /api/songs/{id}/play once per song load.
let _playedSeconds  = 0;       // seconds accumulated this session
let _prevAudioTime  = -1;      // last audio.currentTime snapshot
let _countRecorded  = false;   // whether we already posted for this song
const PLAY_THRESHOLD = 15;     // seconds required to count as a play

function resetPlayTracking() {
  _playedSeconds = 0;
  _prevAudioTime = -1;
  _countRecorded = false;
}

function tickPlayTracking(songId: number) {
  if (_countRecorded) return;
  const a = getAudio();
  const now = a.currentTime;

  if (_prevAudioTime >= 0) {
    const delta = now - _prevAudioTime;
    // Only count genuine forward playback (0 < delta < 2s to ignore seeks)
    if (delta > 0 && delta < 2) {
      _playedSeconds += delta;
    }
  }
  _prevAudioTime = now;

  if (_playedSeconds >= PLAY_THRESHOLD) {
    _countRecorded = true;
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    fetch(`${apiBase}/api/songs/${songId}/play`, { method: "POST" })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data?.playCount !== undefined) {
          // Patch the in-memory song object's playCount so the UI reflects it
          usePlayerStore.setState((s) => {
            if (s.currentSong?.id === songId) {
              return { currentSong: { ...s.currentSong, playCount: data.playCount } };
            }
            return {};
          });
        }
      })
      .catch(() => { /* silent — network failure doesn't break playback */ });
  }
}

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  originalQueue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
  currentTime: number;
  duration: number;
  volume: number;

  play: (song: Song, queue?: Song[]) => void;
  addToQueue: (song: Song) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Wire Audio events once the store is created
  if (typeof window !== "undefined") {
    const a = getAudio();

    a.ontimeupdate = () => {
      set({ currentTime: a.currentTime });
      const { currentSong } = get();
      if (currentSong) tickPlayTracking(currentSong.id);
    };

    a.ondurationchange = () =>
      set({ duration: isFinite(a.duration) ? a.duration : 0 });

    a.onended = () => {
      const { repeatMode } = get();
      if (repeatMode === "one") {
        a.currentTime = 0;
        a.play();
      } else {
        get().next();
      }
    };

    a.onplay  = () => { set({ isPlaying: true }); };
    a.onpause = () => { set({ isPlaying: false }); };
  }

  return {
    currentSong: null,
    queue: [],
    originalQueue: [],
    queueIndex: -1,
    isPlaying: false,
    isShuffled: false,
    repeatMode: "none",
    currentTime: 0,
    duration: 0,
    volume: 0.8,

    play: (song, queue) => {
      const a = getAudio();
      const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
      a.src = `${apiBase}${song.streamUrl}`;
      a.volume = get().volume;
      a.play().catch(() => {});

      // Reset 15-second play-count tracker for the new song
      resetPlayTracking();

      const newQueue = queue ?? [song];
      const idx = newQueue.findIndex((s) => s.id === song.id);

      set({
        currentSong: song,
        queue: newQueue,
        originalQueue: newQueue,
        queueIndex: idx >= 0 ? idx : 0,
        isPlaying: true,
        currentTime: 0,
      });
    },

    addToQueue: (song: Song) => {
      const { queue, queueIndex, isShuffled, originalQueue } = get();

      if (!queue.length) {
        // Nothing playing — just start this song
        get().play(song, [song]);
        return;
      }

      // Insert right after current track
      const newQueue = [...queue];
      newQueue.splice(queueIndex + 1, 0, song);

      // Keep originalQueue in sync
      const newOriginal = isShuffled
        ? [...originalQueue, song]
        : newQueue;

      set({ queue: newQueue, originalQueue: newOriginal });
    },

    pause: () => {
      getAudio().pause();
      set({ isPlaying: false });
    },

    resume: () => {
      getAudio().play().catch(() => {});
      set({ isPlaying: true });
    },

    togglePlay: () => {
      const { isPlaying } = get();
      if (isPlaying) get().pause(); else get().resume();
    },

    next: () => {
      const { queue, queueIndex, repeatMode } = get();
      if (!queue.length) return;

      let nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === "all") nextIdx = 0;
        else {
          set({ isPlaying: false });
          return;
        }
      }
      get().play(queue[nextIdx], queue);
    },

    prev: () => {
      const { queue, queueIndex, currentTime } = get();
      const a = getAudio();

      // If more than 3 seconds in, restart current song
      if (currentTime > 3) {
        a.currentTime = 0;
        return;
      }

      const prevIdx = Math.max(0, queueIndex - 1);
      get().play(queue[prevIdx], queue);
    },

    seek: (time) => {
      const a = getAudio();
      a.currentTime = time;
      set({ currentTime: time });
    },

    setVolume: (vol) => {
      const a = getAudio();
      a.volume = vol;
      set({ volume: vol });
    },

    toggleShuffle: () => {
      const { isShuffled, queue, originalQueue, currentSong } = get();
      if (isShuffled) {
        // Restore original order
        const idx = originalQueue.findIndex((s) => s.id === currentSong?.id);
        set({ isShuffled: false, queue: originalQueue, queueIndex: idx >= 0 ? idx : 0 });
      } else {
        // Shuffle keeping current song first
        const others = queue.filter((s) => s.id !== currentSong?.id);
        const shuffled = [
          ...(currentSong ? [currentSong] : []),
          ...others.sort(() => Math.random() - 0.5),
        ];
        set({ isShuffled: true, queue: shuffled, queueIndex: 0 });
      }
    },

    toggleRepeat: () => {
      const map: Record<string, "none" | "one" | "all"> = {
        none: "all",
        all: "one",
        one: "none",
      };
      set((s) => ({ repeatMode: map[s.repeatMode] }));
    },

    setCurrentTime: (t) => set({ currentTime: t }),
    setDuration:    (d) => set({ duration: d }),
  };
});
