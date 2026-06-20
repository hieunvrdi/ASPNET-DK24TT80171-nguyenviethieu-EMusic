import type { ArtistBrief, Song } from "@/types";

/**
 * Return a display string for all artists on a song/album.
 * Falls back to the legacy `artistName` field if `artists` array is empty.
 *
 * Format:
 *   1 artist  → "Sơn Tùng M-TP"
 *   2+ artists → "Sơn Tùng M-TP ft. MONO, jack"
 */
export function artistsLabel(
  artists: ArtistBrief[] | undefined | null,
  fallback: string = ""
): string {
  if (!artists || artists.length === 0) return fallback;
  if (artists.length === 1) return artists[0].name;
  const [primary, ...feat] = artists;
  return `${primary.name} ft. ${feat.map((a) => a.name).join(", ")}`;
}

/** Convenience wrapper that reads directly from a Song object */
export function songArtistsLabel(song: Pick<Song, "artists" | "artistName">): string {
  return artistsLabel(song.artists, song.artistName);
}
