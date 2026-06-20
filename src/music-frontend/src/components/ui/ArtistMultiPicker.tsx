"use client";

import { useState } from "react";
import type { Artist } from "@/types";

interface Props {
  artists: Artist[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  required?: boolean;
  label?: string;
}

/**
 * Multi-select artist picker.
 * The first selected ID is considered the "primary" artist (used for file path).
 * Shows selected artists as removable chips, with a search+list below.
 */
export default function ArtistMultiPicker({
  artists,
  selectedIds,
  onChange,
  required = false,
  label = "Ca sĩ",
}: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = artists.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const remove = (id: number) => onChange(selectedIds.filter((x) => x !== id));

  const selectedArtists = selectedIds
    .map((id) => artists.find((a) => a.id === id))
    .filter(Boolean) as Artist[];

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sp-silver text-xs font-bold">
          {label} {required && <span className="text-sp-green">*</span>}
        </label>
        {selectedIds.length > 0 && (
          <span className="text-sp-silver text-xs opacity-60">
            {selectedIds.length} đã chọn
            {selectedIds.length > 1 && " · người đầu tiên = ca sĩ chính"}
          </span>
        )}
      </div>

      {/* Selected chips */}
      {selectedArtists.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedArtists.map((a, idx) => (
            <span
              key={a.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                idx === 0
                  ? "bg-sp-green text-sp-black"
                  : "bg-sp-mid text-white border border-sp-border"
              }`}
            >
              {idx === 0 && <span className="text-[10px]">★</span>}
              {a.name}
              <button
                type="button"
                onClick={() => remove(a.id)}
                className={`ml-0.5 text-xs leading-none hover:opacity-70 transition-opacity ${
                  idx === 0 ? "text-sp-black" : "text-sp-silver"
                }`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Toggle dropdown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-sp-mid text-left px-3 py-2.5 rounded text-sm text-sp-silver hover:text-white focus:outline-none focus:ring-1 focus:ring-sp-green flex items-center justify-between transition-colors"
      >
        <span>
          {selectedIds.length === 0
            ? `-- Chọn ${label.toLowerCase()} --`
            : `${selectedIds.length} ca sĩ đã chọn`}
        </span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-[#282828] border border-sp-border rounded-lg shadow-sp-heavy overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2 border-b border-sp-border/50">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm ca sĩ..."
              className="w-full bg-sp-mid text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/60"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sp-silver text-xs">Không tìm thấy</p>
            ) : (
              filtered.map((a) => {
                const checked = selectedIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-sp-mid ${
                      checked ? "text-sp-green" : "text-white"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 text-xs ${
                        checked
                          ? "bg-sp-green border-sp-green text-sp-black"
                          : "border-sp-border"
                      }`}
                    >
                      {checked && "✓"}
                    </span>
                    <span className="flex-1 text-left truncate">{a.name}</span>
                    {checked && selectedIds.indexOf(a.id) === 0 && (
                      <span className="text-[10px] text-sp-green opacity-70">chính</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Done button */}
          <div className="px-3 py-2 border-t border-sp-border/50">
            <button
              type="button"
              onClick={() => { setOpen(false); setSearch(""); }}
              className="w-full py-1.5 text-xs font-bold text-sp-green hover:text-white transition-colors"
            >
              Xong ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
