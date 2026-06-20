"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import FavoriteButton from "@/components/song/FavoriteButton";
import { songArtistsLabel } from "@/lib/artists";
import type { Song, ApiResponse } from "@/types";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function FavoritesPage() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const openMenu = useContextMenuStore((s) => s.open);
  const [songs, setSongs]   = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { void router.push("/login"); return; }
    api
      .get<ApiResponse<Song[]>>("/api/favorites")
      .then((r) => setSongs(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="flex items-end gap-4 mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-700 to-sp-black rounded flex items-center justify-center">
          <span className="text-4xl">❤️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-sp-silver uppercase tracking-widest mb-1">Playlist</p>
          <h1 className="text-3xl font-bold text-white">Bài hát yêu thích</h1>
          <p className="text-sp-silver text-sm mt-1">
            {loading ? "Đang tải..." : `${songs.length} bài hát`}
          </p>
        </div>

        {/* Play All */}
        {!loading && songs.length > 0 && (
          <button
            onClick={() => play(songs[0], songs)}
            className="flex items-center gap-2 px-6 py-3 bg-sp-green text-sp-black font-bold rounded-full hover:scale-105 transition-transform text-sm"
          >
            ▶ Phát tất cả
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sp-silver text-sm">Đang tải...</p>
      ) : songs.length === 0 ? (
        <p className="text-sp-silver text-sm">
          Chưa có bài hát yêu thích. Nhấn ♥ trên bài hát để thêm vào đây!
        </p>
      ) : (
        <div className="bg-sp-surface rounded-lg overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_36px] sm:grid-cols-[auto_1fr_1fr_36px_80px] gap-4 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
            <span className="w-6 text-center">#</span>
            <span>Tiêu đề</span>
            <span className="hidden sm:block">Nghệ sĩ</span>
            <span />
            <span className="hidden sm:block text-right">Thời lượng</span>
          </div>

          {songs.map((song, i) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => isActive ? togglePlay() : play(song, songs)}
                onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs, e.clientX, e.clientY); }}
                className={`grid grid-cols-[auto_1fr_36px] sm:grid-cols-[auto_1fr_1fr_36px_80px] gap-4 px-4 py-3 items-center cursor-pointer group transition-colors hover:bg-sp-mid ${
                  isActive ? "bg-sp-mid/50" : ""
                }`}
              >
                <span className="w-6 text-center text-sp-silver text-sm">
                  {isActive && isPlaying ? <span className="text-sp-green">▶</span> : i + 1}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${isActive ? "text-sp-green" : "text-white"}`}>
                    {song.title}
                  </p>
                  <p className="sm:hidden text-xs text-sp-silver truncate mt-0.5">{songArtistsLabel(song)}</p>
                </div>
                <p className="hidden sm:block text-sm text-sp-silver truncate">{songArtistsLabel(song)}</p>

                <FavoriteButton
                  songId={song.id}
                  className="text-base"
                  onToggle={(isFav) => {
                    if (!isFav) setSongs((prev) => prev.filter((s) => s.id !== song.id));
                  }}
                />

                <p className="hidden sm:block text-sm text-sp-silver text-right">{fmt(song.durationSeconds)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
