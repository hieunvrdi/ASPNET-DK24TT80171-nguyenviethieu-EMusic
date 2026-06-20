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

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    Approved: { cls: "bg-sp-green/20 text-sp-green",      label: "Đã duyệt"  },
    Pending:  { cls: "bg-yellow-500/20 text-yellow-400",  label: "Chờ duyệt" },
    Rejected: { cls: "bg-red-500/20 text-red-400",        label: "Từ chối"   },
  };
  const { cls, label } = cfg[status] ?? { cls: "bg-sp-mid text-sp-silver", label: status };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function MyUploadsPage() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();

  const openMenu = useContextMenuStore((s) => s.open);
  const [songs, setSongs]       = useState<Song[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .get<ApiResponse<Song[]>>("/api/songs/my-uploads")
      .then((r) => setSongs(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePlay = (song: Song) => {
    if (song.status !== "Approved") return; // chỉ phát bài đã duyệt
    if (currentSong?.id === song.id) togglePlay();
    else play(song, songs.filter((s) => s.status === "Approved"));
  };

  const handleDelete = async (song: Song) => {
    if (!confirm(`Xóa bài hát "${song.title}"? Thao tác không thể hoàn tác.`)) return;
    setDeleting(song.id);
    try {
      await api.delete(`/api/songs/${song.id}`);
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
    } catch {
      alert("Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  // Stats
  const approved = songs.filter((s) => s.status === "Approved").length;
  const pending  = songs.filter((s) => s.status === "Pending").length;
  const rejected = songs.filter((s) => s.status === "Rejected").length;
  const totalPlays = songs.reduce((sum, s) => sum + s.playCount, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-1">Bài hát đã upload</h1>
      <p className="text-sp-silver text-sm mb-6">
        {loading ? "Đang tải..." : `${songs.length} bài hát`}
      </p>

      {/* Stats cards */}
      {!loading && songs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Tổng cộng",   value: songs.length,            color: "text-white" },
            { label: "Đã duyệt",    value: approved,                color: "text-sp-green" },
            { label: "Chờ duyệt",   value: pending,                 color: "text-yellow-400" },
            { label: "Lượt nghe",   value: totalPlays.toLocaleString(), color: "text-blue-400" },
          ].map((card) => (
            <div key={card.label} className="bg-sp-surface rounded-xl p-4">
              <p className="text-sp-silver text-xs uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {rejected > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm">
          ⚠️ Bạn có {rejected} bài hát bị từ chối. Xem lại và upload lại nếu cần.
        </div>
      )}

      {/* Song list */}
      <div className="bg-sp-surface rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_36px_100px_90px_120px_80px] gap-4 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
          <span className="w-8 text-center">#</span>
          <span>Tiêu đề / Nghệ sĩ</span>
          <span />
          <span className="text-right">Thời lượng</span>
          <span className="text-right">Lượt nghe</span>
          <span>Trạng thái</span>
          <span className="text-right">Xóa</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sp-silver text-sm">Đang tải...</div>
        ) : songs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-4xl mb-3">🎵</p>
            <p className="text-white font-bold">Bạn chưa upload bài hát nào</p>
            <p className="text-sp-silver text-sm mt-1">
              <a href="/upload" className="text-sp-green hover:underline">Upload ngay</a>
            </p>
          </div>
        ) : (
          songs.map((song, i) => {
            const isActive = currentSong?.id === song.id;
            const canPlay  = song.status === "Approved";
            return (
              <div
                key={song.id}
                onClick={() => canPlay && handlePlay(song)}
                onContextMenu={(e) => { e.preventDefault(); openMenu(song, songs.filter(s => s.status === "Approved"), e.clientX, e.clientY); }}
                className={`grid grid-cols-[auto_1fr_36px_100px_90px_120px_80px] gap-4 px-4 py-3 items-center border-b border-sp-border/50 transition-colors ${
                  canPlay ? "cursor-pointer hover:bg-sp-mid group" : "cursor-default opacity-80"
                } ${isActive ? "bg-sp-mid/50" : ""}`}
              >
                {/* # */}
                <div className="w-8 text-center text-sp-silver text-sm">
                  {isActive && isPlaying ? (
                    <span className="text-sp-green text-xs">▶</span>
                  ) : (
                    <>
                      <span className={canPlay ? "group-hover:hidden" : ""}>{i + 1}</span>
                      {canPlay && (
                        <span className="hidden group-hover:inline text-white">▶</span>
                      )}
                    </>
                  )}
                </div>

                {/* Title + Artist */}
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${isActive ? "text-sp-green" : "text-white"}`}>
                    {song.title}
                  </p>
                  <p className="text-sp-silver text-xs truncate">{songArtistsLabel(song)}</p>
                </div>

                {/* Heart */}
                {canPlay && (
                  <FavoriteButton songId={song.id} className="text-base" />
                )}
                {!canPlay && <span />}

                {/* Duration */}
                <p className="text-sp-silver text-sm text-right">{fmt(song.durationSeconds)}</p>

                {/* Play count */}
                <p className="text-sp-silver text-sm text-right font-mono">
                  {song.playCount.toLocaleString()}
                </p>

                {/* Status */}
                <div><StatusBadge status={song.status} /></div>

                {/* Delete */}
                <div className="flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(song); }}
                    disabled={deleting === song.id}
                    className="p-1.5 text-sp-silver hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Xóa bài hát"
                  >
                    {deleting === song.id ? "…" : "🗑"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
