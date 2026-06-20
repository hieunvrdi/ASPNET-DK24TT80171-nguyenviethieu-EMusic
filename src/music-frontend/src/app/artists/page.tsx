"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import type { Artist, ApiResponse } from "@/types";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<Artist[]>>("/api/artists")
      .then((r) => setArtists(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-1">Nghệ sĩ</h1>
      <p className="text-sp-silver text-sm mb-8">
        {loading ? "Đang tải..." : `${artists.length} nghệ sĩ`}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-full bg-sp-mid mb-3" />
              <div className="h-4 bg-sp-mid rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.id}`}
              className="group text-center"
            >
              <div className="aspect-square rounded-full bg-sp-mid mx-auto mb-3 flex items-center justify-center overflow-hidden group-hover:ring-2 group-hover:ring-sp-green transition-all shadow-sp-medium">
                {artist.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(artist.avatarUrl)!}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🎤</span>
                )}
              </div>
              <p className="text-white text-sm font-bold truncate group-hover:text-sp-green transition-colors">
                {artist.name}
              </p>
              <p className="text-sp-silver text-xs mt-0.5">Nghệ sĩ</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
