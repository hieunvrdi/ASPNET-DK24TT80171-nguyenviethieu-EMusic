"use client";

import Link from "next/link";
import { usePlayerStore } from "@/store/playerStore";
import { mediaUrl } from "@/lib/media";
import { songArtistsLabel } from "@/lib/artists";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";

interface PlayerBarProps {
  queueOpen: boolean;
  onToggleQueue: () => void;
}

export default function PlayerBar({ queueOpen, onToggleQueue }: PlayerBarProps) {
  const {
    currentSong,
    isPlaying,
    isShuffled,
    repeatMode,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  if (!currentSong) {
    return (
      <div className="h-[58px] md:h-[72px] bg-sp-surface border-t border-sp-border flex items-center justify-center">
        <p className="text-sp-silver text-sm">Chọn bài hát để bắt đầu nghe</p>
      </div>
    );
  }

  const coverSrc = mediaUrl(currentSong.coverUrl);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-sp-surface border-t border-[#282828] select-none relative">
      {/* ── Mobile layout ──────────────────────────────────────────────────── */}
      <div className="flex md:hidden items-center gap-2 px-3 h-[58px]">
        {/* Cover + info — tap to open detail */}
        <Link
          href={`/songs/${currentSong.id}`}
          className="flex items-center gap-2 flex-1 min-w-0 group"
        >
          <div className="w-10 h-10 rounded bg-sp-mid flex-shrink-0 overflow-hidden group-hover:ring-1 group-hover:ring-sp-green transition-all">
            {coverSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt={currentSong.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base">🎵</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold truncate leading-tight group-hover:text-sp-green transition-colors">
              {currentSong.title}
            </p>
            <p className="text-sp-silver text-xs truncate leading-tight">
              {songArtistsLabel(currentSong)}
            </p>
          </div>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={prev} className="w-9 h-9 flex items-center justify-center text-sp-silver hover:text-white text-lg">
            ⏮
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            <span className="text-sp-black text-base leading-none">{isPlaying ? "⏸" : "▶"}</span>
          </button>
          <button onClick={next} className="w-9 h-9 flex items-center justify-center text-sp-silver hover:text-white text-lg">
            ⏭
          </button>
          <button
            onClick={onToggleQueue}
            className={`w-9 h-9 flex items-center justify-center text-lg transition-colors ${
              queueOpen ? "text-sp-green" : "text-sp-silver"
            }`}
          >
            ≡
          </button>
        </div>
      </div>

      {/* Progress strip — mobile only (thin bar at bottom of player) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-0.5 bg-sp-border">
        <div className="h-full bg-sp-green transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* ── Desktop layout ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center px-4 gap-4 h-[90px]">
        {/* Left — song info (click → detail page) */}
        <Link
          href={`/songs/${currentSong.id}`}
          className="flex items-center gap-3 w-[30%] min-w-0 group"
        >
          <div className="w-14 h-14 rounded bg-sp-mid flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-1 group-hover:ring-sp-green transition-all">
            {coverSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt={currentSong.title} className="w-full h-full object-cover rounded" />
            ) : (
              <span className="text-2xl">🎵</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold truncate group-hover:text-sp-green transition-colors">
              {currentSong.title}
            </p>
            <p className="text-sp-silver text-xs truncate">{songArtistsLabel(currentSong)}</p>
          </div>
        </Link>

        {/* Center — controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`text-lg transition-colors ${isShuffled ? "text-sp-green" : "text-sp-silver hover:text-white"}`}
              title="Phát ngẫu nhiên"
            >⇄</button>
            <button onClick={prev} className="text-sp-silver hover:text-white transition-colors text-xl">⏮</button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              <span className="text-sp-black text-lg leading-none">{isPlaying ? "⏸" : "▶"}</span>
            </button>
            <button onClick={next} className="text-sp-silver hover:text-white transition-colors text-xl">⏭</button>
            <button
              onClick={toggleRepeat}
              className={`text-sm transition-colors ${repeatMode !== "none" ? "text-sp-green" : "text-sp-silver hover:text-white"}`}
              title={`Lặp lại: ${repeatMode}`}
            >
              {repeatMode === "one" ? "🔂" : "🔁"}
            </button>
          </div>
          <div className="w-full max-w-lg">
            <ProgressBar />
          </div>
        </div>

        {/* Right — volume + queue toggle */}
        <div className="w-[30%] flex items-center justify-end gap-3">
          <VolumeControl />
          <button
            onClick={onToggleQueue}
            title="Danh sách phát"
            className={`text-lg transition-colors flex-shrink-0 ${queueOpen ? "text-sp-green" : "text-sp-silver hover:text-white"}`}
          >≡</button>
        </div>
      </div>
    </div>
  );
}
