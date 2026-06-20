"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { usePlayerStore } from "@/store/playerStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import FavoriteButton from "@/components/song/FavoriteButton";
import { songArtistsLabel } from "@/lib/artists";
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

  const pageSize = 20;
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const openMenu = useContextMenuStore((s) => s.open);

  const load = useCallback((p: number, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
    if (q) params.set("search", q);

    api
      .get<PagedResult<Song>>(`/api/songs?${params}`)
      .then((r) => { setSongs(r.data.data); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setQuery(search); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(page, query); }, [page, query, load]);

  const totalPages = Math.ceil(total / pageSize);

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) togglePlay();
    else play(song, songs);
  };

  return (
    <div className="p-6">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-white whitespace-nowrap">Khám phá nhạc</h1>
        <div className="relative w-full sm:flex-1 sm:max-w-md">
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
      </div>

      {!loading && (
        <p className="text-sp-silver text-xs mb-4">
          {total} bài hát{query ? ` cho "${query}"` : ""}
        </p>
      )}

      {/* Song list */}
      <div className="bg-sp-surface rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_36px] sm:grid-cols-[auto_1fr_1fr_36px_80px] gap-4 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
          <span className="w-8 text-center">#</span>
          <span>Tiêu đề</span>
          <span className="hidden sm:block">Nghệ sĩ</span>
          <span />
          <span className="hidden sm:block text-right">Thời lượng</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sp-silver text-sm">Đang tải...</div>
        ) : songs.length === 0 ? (
          <div className="p-8 text-center text-sp-silver text-sm">Không tìm thấy bài hát nào.</div>
        ) : (
          songs.map((song, i) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => handlePlay(song)}
                onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs, e.clientX, e.clientY); }}
                className={`grid grid-cols-[auto_1fr_36px] sm:grid-cols-[auto_1fr_1fr_36px_80px] gap-4 px-4 py-3 items-center cursor-pointer group transition-colors hover:bg-sp-mid ${
                  isActive ? "bg-sp-mid/50" : ""
                }`}
              >
                {/* # */}
                <div className="w-8 text-center text-sp-silver text-sm">
                  {isActive && isPlaying ? (
                    <span className="text-sp-green text-xs">▶</span>
                  ) : (
                    <span className="group-hover:hidden">{(page - 1) * pageSize + i + 1}</span>
                  )}
                  {!isActive && (
                    <span className="hidden group-hover:inline text-white">▶</span>
                  )}
                </div>

                {/* Title + artist on mobile */}
                <div className="min-w-0">
                  <Link
                    href={`/songs/${song.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-sm font-bold truncate block hover:underline underline-offset-2 ${isActive ? "text-sp-green" : "text-white"}`}
                  >
                    {song.title}
                  </Link>
                  <p className="sm:hidden text-xs text-sp-silver truncate mt-0.5">{songArtistsLabel(song)}</p>
                </div>

                {/* Artist — desktop only */}
                <a
                  href={`/artists/${song.artistId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden sm:block text-sm text-sp-silver truncate hover:text-white hover:underline underline-offset-2 transition-colors"
                >
                  {songArtistsLabel(song)}
                </a>

                {/* Heart */}
                <FavoriteButton songId={song.id} className="text-base" />

                {/* Duration — desktop only */}
                <p className="hidden sm:block text-sm text-sp-silver text-right">{fmt(song.durationSeconds)}</p>
              </div>
            );
          })
        )}
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
    </div>
  );
}
