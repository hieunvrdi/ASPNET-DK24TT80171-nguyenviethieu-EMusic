"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import { usePlayerStore } from "@/store/playerStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import FavoriteButton from "@/components/song/FavoriteButton";
import { songArtistsLabel } from "@/lib/artists";
import type { Song, PagedResult } from "@/types";

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const openMenu = useContextMenuStore((s) => s.open);

  useEffect(() => {
    api
      .get<PagedResult<Song>>("/api/songs?page=1&pageSize=12")
      .then((r) => setSongs(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) togglePlay();
    else play(song, songs);
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-white mb-1">Chào buổi tối 👋</h1>
      <p className="text-sp-silver text-sm mb-8">Những bài hát mới nhất dành cho bạn</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-sp-mid rounded-lg animate-pulse aspect-square" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {songs.map((song) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => handlePlay(song)}
                onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs, e.clientX, e.clientY); }}
                className="bg-sp-surface hover:bg-sp-card rounded-lg p-4 cursor-pointer transition-colors group shadow-sp-medium relative"
              >
                {/* Cover art */}
                <div className="aspect-square bg-sp-mid rounded-md mb-3 flex items-center justify-center relative overflow-hidden">
                  {mediaUrl(song.coverUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(song.coverUrl)!} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎵</span>
                  )}
                  {/* Play overlay */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-sp-green flex items-center justify-center shadow-sp-heavy">
                      <span className="text-sp-black text-xl">
                        {isActive && isPlaying ? "⏸" : "▶"}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/songs/${song.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-sm font-bold truncate block hover:underline underline-offset-2 ${isActive ? "text-sp-green" : "text-white"}`}
                >
                  {song.title}
                </Link>
                <p className="text-xs text-sp-silver truncate mt-0.5">{songArtistsLabel(song)}</p>

                {/* Heart button — top-right of card */}
                <div
                  className="absolute top-3 right-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FavoriteButton songId={song.id} className="text-lg drop-shadow" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
