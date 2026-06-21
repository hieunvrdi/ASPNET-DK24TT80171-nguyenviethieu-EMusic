import type { Song } from "@/types";
import { mediaUrl } from "./media";
import { songArtistsLabel } from "./artists";

export function updateMediaSession(
  song: Song | null,
  isPlaying: boolean,
  currentTime: number = 0,
  duration: number = 0
) {
  if (!("mediaSession" in navigator)) return;

  const session = navigator.mediaSession;

  if (!song) {
    session.metadata = null;
    return;
  }

  // Update metadata with multiple artwork sizes
  session.metadata = new MediaMetadata({
    title: song.title,
    artist: songArtistsLabel(song),
    album: song.album?.title || "",
    artwork: song.coverUrl
      ? [
          {
            src: mediaUrl(song.coverUrl),
            sizes: "96x96",
            type: "image/jpeg",
          },
          {
            src: mediaUrl(song.coverUrl),
            sizes: "256x256",
            type: "image/jpeg",
          },
          {
            src: mediaUrl(song.coverUrl),
            sizes: "512x512",
            type: "image/jpeg",
          },
        ]
      : [],
  });

  session.playbackState = isPlaying ? "playing" : "paused";

  // Update position state (for progress bar display)
  if (duration > 0) {
    session.setPositionState({
      duration: duration,
      playbackRate: 1,
      position: Math.max(0, currentTime),
    });
  }
}

export function setMediaSessionHandlers(handlers: {
  play: () => void;
  pause: () => void;
  nexttrack: () => void;
  previoustrack: () => void;
  seek: (time: number) => void;
  seekforward?: (seconds?: number) => void;
  seekbackward?: (seconds?: number) => void;
}) {
  if (!("mediaSession" in navigator)) return;

  const session = navigator.mediaSession;

  session.setActionHandler("play", handlers.play);
  session.setActionHandler("pause", handlers.pause);
  session.setActionHandler("nexttrack", handlers.nexttrack);
  session.setActionHandler("previoustrack", handlers.previoustrack);

  // Seek to specific position (from progress bar drag)
  session.setActionHandler("seekto", (event) => {
    if (event.seekTime !== undefined) {
      handlers.seek(event.seekTime);
    }
  });

  // Skip forward/backward (usually +10/-10 seconds)
  if (handlers.seekforward) {
    session.setActionHandler("seekforward", (event) => {
      handlers.seekforward?.(event.seekOffset || 10);
    });
  }

  if (handlers.seekbackward) {
    session.setActionHandler("seekbackward", (event) => {
      handlers.seekbackward?.(event.seekOffset || 10);
    });
  }
}
