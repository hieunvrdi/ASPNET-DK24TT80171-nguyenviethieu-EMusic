"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import { usePlayerStore } from "@/store/playerStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import FavoriteButton from "@/components/song/FavoriteButton";
import type { Artist, Song, ApiResponse, PagedResult } from "@/types";

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [artist, setArtist]   = useState<Artist | null>(null);
  const [songs, setSongs]     = useState<Song[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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

  // Load songs (with load more)
  useEffect(() => {
    const isLoadMore = page > 1;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    api
      .get<PagedResult<Song>>(`/api/artists/${id}/songs?page=${page}&pageSize=${pageSize}`)
      .then((r) => {
        if (isLoadMore) {
          setSongs((prev) => [...prev, ...r.data.data]);
        } else {
          setSongs(r.data.data);
        }
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      });
  }, [id, page]);

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) togglePlay();
    else play(song, songs);
  };

  const hasMore = songs.length < total;

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

        {/* Songs */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Bài hát</h2>
          {songs.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-sp-green text-sp-black"
                    : "bg-sp-mid text-sp-silver hover:text-white"
                }`}
                title="Dạng danh sách"
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-sp-green text-sp-black"
                    : "bg-sp-mid text-sp-silver hover:text-white"
                }`}
                title="Dạng lưới"
              >
                ⊞
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={viewMode === "grid" ? "bg-sp-mid rounded-lg h-64 animate-pulse" : "h-16 bg-sp-mid rounded animate-pulse"} />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <p className="text-sp-silver text-sm">Nghệ sĩ này chưa có bài hát nào.</p>
        ) : viewMode === "grid" ? (
          // Grid view (cards)
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {songs.map((song) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => handlePlay(song)}
                    onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs, e.clientX, e.clientY); }}
                    className="group cursor-pointer"
                  >
                    <div className={`relative rounded-lg overflow-hidden mb-3 aspect-square bg-sp-mid flex items-center justify-center transition-all ${
                      isActive ? "ring-2 ring-sp-green" : ""
                    } group-hover:ring-2 group-hover:ring-sp-green/50`}>
                      {song.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(song.coverUrl)}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">🎵</span>
                      )}

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className={`text-4xl ${isActive && isPlaying ? "text-sp-green" : "text-white"}`}>
                          {isActive && isPlaying ? "⏸" : "▶"}
                        </span>
                      </div>

                      {/* Heart button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FavoriteButton songId={song.id} className="text-xl" />
                      </div>
                    </div>

                    <p className={`text-sm font-bold truncate line-clamp-2 ${isActive ? "text-sp-green" : "text-white"}`}>
                      {song.title}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-pill bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loadingMore ? "Đang tải..." : "Tải thêm"}
                </button>
              </div>
            )}
          </>
        ) : (
          // List view
          <>
            <div className="bg-sp-surface rounded-lg overflow-hidden">
              {songs.map((song) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => handlePlay(song)}
                    onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs, e.clientX, e.clientY); }}
                    className={`flex items-center gap-3 px-4 py-3 group cursor-pointer transition-colors hover:bg-sp-mid/50 border-b border-sp-border/50 last:border-0 ${
                      isActive ? "bg-sp-mid/30" : ""
                    }`}
                  >
                    {/* Cover thumbnail */}
                    <div className={`w-12 h-12 rounded flex-shrink-0 bg-sp-mid flex items-center justify-center overflow-hidden transition-all ${
                      isActive ? "ring-2 ring-sp-green" : ""
                    }`}>
                      {song.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(song.coverUrl)}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">🎵</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isActive ? "text-sp-green" : "text-white"}`}>
                        {song.title}
                      </p>
                      {song.albumTitle && (
                        <p className="text-xs text-sp-silver truncate">{song.albumTitle}</p>
                      )}
                    </div>

                    {/* Play icon */}
                    <div className="flex-shrink-0 text-sp-silver group-hover:text-white transition-colors">
                      {isActive && isPlaying ? (
                        <span className="text-sp-green">⏸</span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100">▶</span>
                      )}
                    </div>

                    {/* Heart */}
                    <FavoriteButton songId={song.id} className="text-base flex-shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-pill bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loadingMore ? "Đang tải..." : "Tải thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
