"use client";

import { usePlayerStore } from "@/store/playerStore";

function fmt(sec: number) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ProgressBar() {
  const { currentTime, duration, seek } = usePlayerStore();
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs text-sp-silver w-8 text-right select-none">
        {fmt(currentTime)}
      </span>

      {/* Track */}
      <div
        className="flex-1 h-1 bg-sp-border rounded-full cursor-pointer group relative"
        onClick={handleClick}
      >
        {/* Filled */}
        <div
          className="h-full bg-sp-silver rounded-full group-hover:bg-sp-green transition-colors relative"
          style={{ width: `${pct}%` }}
        >
          {/* Thumb */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sp-medium" />
        </div>
      </div>

      <span className="text-xs text-sp-silver w-8 select-none">
        {fmt(duration)}
      </span>
    </div>
  );
}
