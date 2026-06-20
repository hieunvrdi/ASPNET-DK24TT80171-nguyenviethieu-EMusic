"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import { usePlayerStore } from "@/store/playerStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import FavoriteButton from "@/components/song/FavoriteButton";
import type { Artist, Song, ApiResponse, PagedResult } from "@/types";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [artist, setArtist]   = useState<Artist | null>(null);
  const [songs, setSongs]     = useState<Song[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const pageSize = 20;
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const openMenu = useContextMenuStore((s) => s.open);

  // Load artist info
  useEffect(() => {
    api
      .get<ApiResponse<Artist>>(`/api/artists/${id}`)
      .then((r) => setArtist(r.data.data))
      .catch(() => setNotFound(true));
  }, [id]);

  // Load songs (paginated)
  useEffect(() => {
    setLoading(true);
    api
      .get<PagedResult<Song>>(`/api/artists/${id}/songs?page=${page}&pageSize=${pageSize}`)
      .then((r) => { setSongs(r.data.data); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, page]);

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) togglePlay();
    else play(song, songs);
  };

  if (notFound) {
    return (
      <div className="p-6 text-center">
        <p className="text-4xl mb-3">🎤</p>
        <p className="text-white font-bold text-lg">Không tìm thấy nghệ sĩ</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-sp-mid text-white rounded-pill text-sm hover:bg-sp-card transition-colors"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-52 bg-gradient-to-b from-sp-card to-sp-surface flex items-end px-6 pb-6">
        <div className="flex items-end gap-5">
          <div className="w-32 h-32 rounded-full bg-sp-mid border-4 border-sp-surface flex items-center justify-center shadow-sp-heavy flex-shrink-0">
            {artist?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(artist.avatarUrl)!}
                alt={artist.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-5xl">🎤</span>
            )}
          </div>
          <div>
            <p className="text-xs text-sp-silver uppercase tracking-widest mb-1">Nghệ sĩ</p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              {artist?.name ?? "Đang tải..."}
            </h1>
            <p className="text-sp-silver text-sm mt-2">{total} bài hát</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Bio */}
        {artist?.bio && (
          <div className="mb-6">
            <h2 className="text-white font-bold text-lg mb-2">Giới thiệu</h2>
            <p className="text-sp-silver text-sm leading-relaxed max-w-2xl">{artist.bio}</p>
          </div>
        )}

        {/* Play all */}
        {songs.length > 0 && (
          <button
            onClick={() => play(songs[0], songs)}
            className="mb-6 flex items-center gap-2 bg-sp-green text-sp-black font-bold px-6 py-3 rounded-pill hover:scale-105 transition-transform uppercase tracking-wide text-sm"
          >
            ▶ Phát tất cả
          </button>
        )}

        {/* Songs table */}
        <h2 className="text-white font-bold text-lg mb-3">Bài hát</h2>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-sp-mid rounded animate-pulse" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <p className="text-sp-silver text-sm">Nghệ sĩ này chưa có bài hát nào.</p>
        ) : (
          <>
            <div className="bg-sp-surface rounded-lg overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_1fr_36px_80px] gap-4 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
                <span className="w-8 text-center">#</span>
                <span>Tiêu đề</span>
                <span>Album</span>
                <span />
                <span className="text-right">Thời lượng</span>
              </div>

              {songs.map((song, i) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => handlePlay(song)}
                    onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs, e.clientX, e.clientY); }}
                    className={`grid grid-cols-[auto_1fr_1fr_36px_80px] gap-4 px-4 py-3 items-center cursor-pointer group transition-colors hover:bg-sp-mid ${
                      isActive ? "bg-sp-mid/50" : ""
                    }`}
                  >
                    <div className="w-8 text-center text-sp-silver text-sm">
                      {isActive && isPlaying ? (
                        <span className="text-sp-green text-xs">▶</span>
                      ) : (
                        <>
                          <span className="group-hover:hidden">{(page - 1) * pageSize + i + 1}</span>
                          <span className="hidden group-hover:inline text-white">▶</span>
                        </>
                      )}
                    </div>
                    <p className={`text-sm font-bold truncate ${isActive ? "text-sp-green" : "text-white"}`}>
                      {song.title}
                    </p>
                    <p className="text-sm text-sp-silver truncate">{song.albumTitle ?? "—"}</p>

                    {/* Heart */}
                    <FavoriteButton songId={song.id} className="text-base" />

                    <p className="text-sm text-sp-silver text-right">{fmt(song.durationSeconds)}</p>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-1.5 rounded-pill bg-sp-mid text-white text-sm disabled:opacity-40 hover:bg-sp-card transition-colors"
                >‹</button>
                <span className="text-sp-silver text-sm">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-1.5 rounded-pill bg-sp-mid text-white text-sm disabled:opacity-40 hover:bg-sp-card transition-colors"
                >›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
