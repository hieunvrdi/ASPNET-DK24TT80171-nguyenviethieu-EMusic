"use client";

import { usePlayerStore } from "@/store/playerStore";

export default function VolumeControl() {
  const { volume, setVolume } = usePlayerStore();

  const icon =
    volume === 0 ? "🔇" : volume < 0.4 ? "🔈" : volume < 0.7 ? "🔉" : "🔊";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
        className="text-sp-silver hover:text-white transition-colors text-sm"
        title="Toggle mute"
      >
        {icon}
      </button>

      <div className="relative w-24 h-1 bg-sp-border rounded-full cursor-pointer group">
        <div
          className="h-full bg-sp-silver rounded-full group-hover:bg-sp-green transition-colors relative"
          style={{ width: `${volume * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
    </div>
  );
}
