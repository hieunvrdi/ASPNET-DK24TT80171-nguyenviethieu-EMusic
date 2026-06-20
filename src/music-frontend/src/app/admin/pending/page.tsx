"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { songArtistsLabel } from "@/lib/artists";
import type { Song, ApiResponse } from "@/types";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminPendingPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = () => {
    setLoading(true);
    api
      .get<ApiResponse<Song[]>>("/api/admin/songs/pending")
      .then((r) => setSongs(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      await api.patch(`/api/admin/songs/${id}/${action}`);
      // Optimistic UI — remove row immediately
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // On error reload
      loadPending();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bài hát chờ duyệt</h1>
          <p className="text-sp-silver text-sm mt-1">
            {songs.length} bài đang chờ xét duyệt
          </p>
        </div>
        <button
          onClick={loadPending}
          className="px-4 py-2 bg-sp-mid hover:bg-sp-card text-white text-sm rounded-pill transition-colors"
        >
          ↻ Làm mới
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-sp-mid rounded animate-pulse" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="bg-sp-surface rounded-lg p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-white font-bold">Không còn bài hát nào chờ duyệt</p>
          <p className="text-sp-silver text-sm mt-1">
            Tất cả bài hát đã được xử lý.
          </p>
        </div>
      ) : (
        <div className="bg-sp-surface rounded-lg overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_160px_80px_160px] gap-4 px-4 py-3 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
            <span>Bài hát / Nghệ sĩ</span>
            <span>Người upload</span>
            <span>Thời lượng</span>
            <span className="text-center">Hành động</span>
          </div>

          {songs.map((song) => {
            const busy = processing === song.id;
            return (
              <div
                key={song.id}
                className="grid grid-cols-[1fr_160px_80px_160px] gap-4 px-4 py-4 items-center border-b border-sp-border/30 last:border-0 hover:bg-sp-mid/30 transition-colors"
              >
                {/* Song info */}
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate">
                    {song.title}
                  </p>
                  <p className="text-sp-silver text-xs truncate">
                    {songArtistsLabel(song)}
                  </p>
                </div>

                {/* Uploader */}
                <div className="min-w-0">
                  <p className="text-sp-silver text-xs truncate">
                    {new Date(song.uploadedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                {/* Duration */}
                <p className="text-sp-silver text-sm">
                  {fmt(song.durationSeconds)}
                </p>

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleAction(song.id, "approve")}
                    disabled={busy}
                    className="px-3 py-1.5 bg-sp-green text-sp-black text-xs font-bold rounded-pill hover:scale-105 transition-transform disabled:opacity-50 uppercase tracking-wide"
                  >
                    {busy ? "..." : "Duyệt"}
                  </button>
                  <button
                    onClick={() => handleAction(song.id, "reject")}
                    disabled={busy}
                    className="px-3 py-1.5 bg-sp-red/20 text-sp-red text-xs font-bold rounded-pill border border-sp-red/50 hover:bg-sp-red/30 transition-colors disabled:opacity-50 uppercase tracking-wide"
                  >
                    {busy ? "..." : "Từ chối"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
