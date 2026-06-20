"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useContextMenuStore } from "@/store/contextMenuStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { songArtistsLabel } from "@/lib/artists";
import type { Playlist, ApiResponse } from "@/types";

export default function SongContextMenu() {
  const router   = useRouter();
  const { visible, song, songQueue, x, y, close } = useContextMenuStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { play, addToQueue } = usePlayerStore();
  const { user } = useAuthStore();

  const menuRef = useRef<HTMLDivElement>(null);

  // Playlist sub-list state
  const [playlists, setPlaylists]           = useState<Playlist[]>([]);
  const [showPlaylists, setShowPlaylists]   = useState(false);
  const [loadingPL, setLoadingPL]           = useState(false);
  const [addingPL, setAddingPL]             = useState<number | null>(null);
  const [addedPL, setAddedPL]               = useState<number | null>(null);

  // Close sub-list when menu reopens for a different song
  useEffect(() => {
    setShowPlaylists(false);
    setAddedPL(null);
  }, [song?.id]);

  // Close on outside mousedown or Escape
  useEffect(() => {
    if (!visible) return;

    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [visible, close]);

  // Lazy-load user's playlists
  const handleTogglePlaylists = useCallback(async () => {
    if (!user) return;
    setShowPlaylists((v) => !v);
    if (playlists.length > 0) return;
    setLoadingPL(true);
    try {
      const res = await api.get<ApiResponse<Playlist[]>>("/api/playlists");
      setPlaylists(res.data.data);
    } catch {
      /* silent */
    } finally {
      setLoadingPL(false);
    }
  }, [user, playlists.length]);

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!song) return;
    setAddingPL(playlistId);
    try {
      await api.post(`/api/playlists/${playlistId}/songs`, { songId: song.id });
      setAddedPL(playlistId);
      setTimeout(() => {
        setAddedPL(null);
        close();
      }, 800);
    } catch {
      alert("Không thể thêm vào playlist.");
    } finally {
      setAddingPL(null);
    }
  };

  if (!visible || !song || typeof document === "undefined") return null;

  const favorited = isFavorite(song.id);

  const MenuItem = ({
    icon,
    label,
    onClick,
    highlight,
    disabled,
    children,
  }: {
    icon: string;
    label: string;
    onClick?: () => void;
    highlight?: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
  }) => (
    <div>
      <button
        disabled={disabled}
        onClick={onClick}
        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors disabled:opacity-40
          ${highlight ? "text-sp-green hover:bg-sp-mid" : "text-white hover:bg-sp-mid"}`}
      >
        <span className="w-4 text-center text-base leading-none">{icon}</span>
        <span className="flex-1">{label}</span>
      </button>
      {children}
    </div>
  );

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-[#282828] border border-sp-border rounded-xl shadow-sp-heavy py-1.5 w-56 select-none"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Song info header */}
      <div className="px-4 pt-1.5 pb-2.5 border-b border-sp-border/60">
        <p className="text-white text-xs font-bold truncate leading-tight">{song.title}</p>
        <p className="text-sp-silver text-xs truncate mt-0.5">{songArtistsLabel(song)}</p>
      </div>

      <div className="mt-1">
        {/* Play now */}
        <MenuItem
          icon="▶"
          label="Phát ngay"
          highlight
          onClick={() => { play(song, songQueue.length ? songQueue : [song]); close(); }}
        />

        {/* Add to queue */}
        <MenuItem
          icon="⏭"
          label="Thêm vào hàng đợi"
          onClick={() => { addToQueue(song); close(); }}
        />

        <div className="h-px bg-sp-border/60 my-1" />

        {/* Favorite — only for logged-in users */}
        {user && (
          <MenuItem
            icon={favorited ? "♥" : "♡"}
            label={favorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            highlight={favorited}
            onClick={async () => { await toggleFavorite(song.id); close(); }}
          />
        )}

        {/* Add to playlist — only for logged-in users */}
        {user && (
          <>
            <button
              onClick={handleTogglePlaylists}
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-sp-mid transition-colors flex items-center gap-3"
            >
              <span className="w-4 text-center text-base leading-none">📋</span>
              <span className="flex-1">Thêm vào playlist</span>
              <span className="text-sp-silver text-xs">{showPlaylists ? "▾" : "›"}</span>
            </button>

            {showPlaylists && (
              <div className="bg-black/30 max-h-36 overflow-y-auto">
                {loadingPL ? (
                  <p className="px-6 py-2 text-sp-silver text-xs">Đang tải...</p>
                ) : playlists.length === 0 ? (
                  <p className="px-6 py-2 text-sp-silver text-xs">Chưa có playlist nào</p>
                ) : (
                  playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl.id)}
                      disabled={addingPL === pl.id}
                      className="w-full text-left px-6 py-2 text-xs transition-colors disabled:opacity-50
                        text-sp-silver hover:text-white hover:bg-sp-mid"
                    >
                      {addedPL === pl.id
                        ? "✓ Đã thêm"
                        : addingPL === pl.id
                        ? "Đang thêm..."
                        : pl.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}

        <div className="h-px bg-sp-border/60 my-1" />

        {/* View detail */}
        <MenuItem
          icon="🎵"
          label="Xem chi tiết bài hát"
          onClick={() => { router.push(`/songs/${song.id}`); close(); }}
        />

        {/* View artist */}
        <MenuItem
          icon="🎤"
          label="Xem nghệ sĩ"
          onClick={() => { router.push(`/artists/${song.artistId}`); close(); }}
        />
      </div>
    </div>,
    document.body
  );
}
