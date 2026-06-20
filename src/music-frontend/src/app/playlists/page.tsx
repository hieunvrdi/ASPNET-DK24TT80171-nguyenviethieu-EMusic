"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { songArtistsLabel } from "@/lib/artists";
import type { Playlist, PlaylistDetail, Song, ApiResponse } from "@/types";

export default function PlaylistsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { play } = usePlayerStore();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadPlaylists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const loadPlaylists = () => {
    setLoading(true);
    api
      .get<ApiResponse<Playlist[]>>("/api/playlists")
      .then((r) => setPlaylists(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const openPlaylist = async (id: number) => {
    const res = await api.get<ApiResponse<PlaylistDetail>>(
      `/api/playlists/${id}`
    );
    setSelected(res.data.data);
  };

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/api/playlists", { name: newName, isPublic: false });
      setNewName("");
      setShowForm(false);
      loadPlaylists();
    } finally {
      setCreating(false);
    }
  };

  const deletePlaylist = async (id: number) => {
    if (!confirm("Xóa playlist này?")) return;
    await api.delete(`/api/playlists/${id}`);
    if (selected?.id === id) setSelected(null);
    loadPlaylists();
  };

  const removeSong = async (playlistId: number, songId: number) => {
    await api.delete(`/api/playlists/${playlistId}/songs/${songId}`);
    openPlaylist(playlistId);
  };

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 md:gap-6 h-full overflow-y-auto md:overflow-hidden">
      {/* Left — Playlist list */}
      <div className="w-full md:w-72 md:flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Playlist của tôi</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-8 h-8 rounded-full bg-sp-mid text-white hover:bg-sp-card transition-colors flex items-center justify-center text-lg"
            title="Tạo playlist mới"
          >
            +
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={createPlaylist} className="mb-4">
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tên playlist..."
                className="flex-1 bg-sp-mid text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-3 py-2 bg-sp-green text-sp-black rounded text-sm font-bold disabled:opacity-50"
              >
                Tạo
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-sp-mid rounded animate-pulse"
              />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <p className="text-sp-silver text-sm">
            Chưa có playlist nào. Tạo playlist đầu tiên của bạn!
          </p>
        ) : (
          <ul className="space-y-1">
            {playlists.map((pl) => (
              <li
                key={pl.id}
                onClick={() => openPlaylist(pl.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded cursor-pointer transition-colors group ${
                  selected?.id === pl.id
                    ? "bg-sp-mid"
                    : "hover:bg-sp-mid/50"
                }`}
              >
                <div className="w-10 h-10 bg-sp-card rounded flex items-center justify-center flex-shrink-0">
                  <span>📋</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">
                    {pl.name}
                  </p>
                  <p className="text-sp-silver text-xs">
                    {pl.songCount} bài
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlaylist(pl.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-sp-silver hover:text-sp-red transition-opacity text-sm"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right — Playlist detail */}
      <div className="flex-1 min-w-0 min-h-0">
        {selected ? (
          <>
            <div className="flex items-end gap-4 mb-6">
              <div className="w-24 h-24 bg-sp-mid rounded flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sp-silver uppercase tracking-widest mb-1">
                  Playlist
                </p>
                <h2 className="text-3xl font-bold text-white">
                  {selected.name}
                </h2>
                <p className="text-sp-silver text-sm mt-1">
                  {selected.songs.length} bài hát
                </p>
              </div>
              {selected.songs.length > 0 && (
                <button
                  onClick={() => play(selected.songs[0], selected.songs)}
                  className="flex items-center gap-2 px-6 py-3 bg-sp-green text-sp-black font-bold rounded-full hover:scale-105 transition-transform text-sm flex-shrink-0"
                >
                  ▶ Phát tất cả
                </button>
              )}
            </div>

            {selected.songs.length === 0 ? (
              <p className="text-sp-silver text-sm">
                Playlist trống. Vào trang Khám phá để thêm bài hát!
              </p>
            ) : (
              <div className="bg-sp-surface rounded-lg overflow-hidden">
                {selected.songs.map((song: Song, i: number) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-sp-mid transition-colors group cursor-pointer"
                    onClick={() => play(song, selected.songs)}
                  >
                    <span className="text-sp-silver text-sm w-6 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">
                        {song.title}
                      </p>
                      <p className="text-sp-silver text-xs">
                        {songArtistsLabel(song)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSong(selected.id, song.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-sp-silver hover:text-sp-red transition-opacity text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sp-silver text-sm">
              Chọn một playlist để xem nội dung
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
