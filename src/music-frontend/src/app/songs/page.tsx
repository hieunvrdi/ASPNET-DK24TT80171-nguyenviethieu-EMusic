"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import { usePlayerStore } from "@/store/playerStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import FavoriteButton from "@/components/song/FavoriteButton";
import { songArtistsLabel } from "@/lib/artists";
import { SongSkeleton, SongCardSkeleton } from "@/components/ui/Skeleton";
import type { Song, PagedResult } from "@/types";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery]   = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const pageSize = 20;
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const openMenu = useContextMenuStore((s) => s.open);

  const load = useCallback((p: number, q: string, append: boolean = false) => {
    const isLoadMore = append && p > 1;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
    if (q) params.set("search", q);

    api
      .get<PagedResult<Song>>(`/api/songs?${params}`)
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
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setQuery(search); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(page, query, page > 1); }, [page, query, load]);

  const hasMore = songs.length < total;

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) togglePlay();
    else play(song, songs);
  };

  return (
    <div className="p-6">
      {/* Header + Search + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-white whitespace-nowrap">Khám phá nhạc</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sp-silver text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bài hát, nghệ sĩ..."
              className="w-full bg-sp-mid text-white rounded-pill px-4 pl-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
              style={{ boxShadow: "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset" }}
            />
          </div>
          {songs.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
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
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
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
      </div>

      {!loading && (
        <p className="text-sp-silver text-xs mb-4">
          {total} bài hát{query ? ` cho "${query}"` : ""}
        </p>
      )}

      {/* Song list/grid */}
      {loading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SongSkeleton key={i} />
            ))}
          </div>
        )
      ) : songs.length === 0 ? (
        <div className="p-8 text-center text-sp-silver text-sm bg-sp-surface rounded-lg">Không tìm thấy bài hát nào.</div>
      ) : viewMode === "grid" ? (
        // Grid view (cards)
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
      ) : (
        // List view (with cover thumbnails)
        <div className="space-y-2">
          {songs.map((song, i) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => handlePlay(song)}
                onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs, e.clientX, e.clientY); }}
                className={`flex items-center gap-3 px-4 py-3 group cursor-pointer transition-colors hover:bg-sp-mid/50 rounded-lg ${
                  isActive ? "bg-sp-mid/30" : ""
                }`}
              >
                {/* Cover thumbnail with index */}
                <div className={`relative w-14 h-14 rounded flex-shrink-0 bg-sp-mid flex items-center justify-center overflow-hidden transition-all ${
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
                    <span className="text-2xl">🎵</span>
                  )}

                  {/* Index badge */}
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center">
                    {(page - 1) * pageSize + i + 1}
                  </div>

                  {/* Play icon overlay */}
                  {isActive && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-sp-green text-lg">⏸</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/songs/${song.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-sm font-bold truncate block hover:underline underline-offset-2 ${isActive ? "text-sp-green" : "text-white"}`}
                  >
                    {song.title}
                  </Link>
                  <p className="text-xs text-sp-silver truncate mt-0.5">{songArtistsLabel(song)}</p>
                </div>

                {/* Duration */}
                <p className="text-sm text-sp-silver flex-shrink-0">{fmt(song.durationSeconds)}</p>

                {/* Heart */}
                <FavoriteButton songId={song.id} className="text-base flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
