"use client";

import { usePlayerStore } from "@/store/playerStore";
import { mediaUrl } from "@/lib/media";
import { songArtistsLabel } from "@/lib/artists";

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface QueuePanelProps {
  onClose: () => void;
}

export default function QueuePanel({ onClose }: QueuePanelProps) {
  const { queue, queueIndex, currentSong, play } = usePlayerStore();

  const upcoming = queue.slice(queueIndex + 1);
  const previous = queue.slice(0, queueIndex);

  return (
    <div className="fixed inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-[90px] md:w-[340px] bg-[#121212] border-l border-[#282828] z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#282828] flex-shrink-0">
        <h2 className="text-white font-bold text-base">Danh sách phát</h2>
        <button
          onClick={onClose}
          className="text-sp-silver hover:text-white text-xl leading-none transition-colors"
          title="Đóng"
        >
          ✕
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">

        {/* Currently playing */}
        {currentSong && (
          <section>
            <p className="text-sp-silver text-xs font-bold uppercase tracking-widest px-2 mb-2">
              Đang phát
            </p>
            <QueueRow
              song={currentSong}
              isCurrent
              onClick={() => {}}
            />
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mt-4">
            <p className="text-sp-silver text-xs font-bold uppercase tracking-widest px-2 mb-2">
              Tiếp theo ({upcoming.length})
            </p>
            {upcoming.map((song, i) => (
              <QueueRow
                key={`${song.id}-${queueIndex + 1 + i}`}
                song={song}
                isCurrent={false}
                onClick={() => play(song, queue)}
              />
            ))}
          </section>
        )}

        {/* Previous (collapsed) */}
        {previous.length > 0 && (
          <section className="mt-4">
            <p className="text-sp-silver text-xs font-bold uppercase tracking-widest px-2 mb-2">
              Đã phát ({previous.length})
            </p>
            {previous.map((song, i) => (
              <QueueRow
                key={`${song.id}-prev-${i}`}
                song={song}
                isCurrent={false}
                dimmed
                onClick={() => play(song, queue)}
              />
            ))}
          </section>
        )}

        {/* Empty state */}
        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-sp-silver text-sm">
            <span className="text-3xl mb-3">🎵</span>
            <p>Chưa có bài nào trong hàng đợi</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Row component ──────────────────────────────────────────────────────────────
interface QueueRowProps {
  song: import("@/types").Song;
  isCurrent: boolean;
  dimmed?: boolean;
  onClick: () => void;
}

function QueueRow({ song, isCurrent, dimmed, onClick }: QueueRowProps) {
  const coverSrc = mediaUrl(song.coverUrl);

  return (
    <button
      onClick={onClick}
      disabled={isCurrent}
      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left
        ${isCurrent
          ? "bg-sp-mid cursor-default"
          : "hover:bg-sp-mid cursor-pointer"}
        ${dimmed ? "opacity-50" : ""}
      `}
    >
      {/* Cover */}
      <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-base">🎵</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isCurrent ? "text-sp-green" : "text-white"
          }`}
        >
          {song.title}
        </p>
        <p className="text-xs text-sp-silver truncate">{songArtistsLabel(song)}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-sp-silver flex-shrink-0">
        {fmtDuration(song.durationSeconds)}
      </span>
    </button>
  );
}
