// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  userName: string;
  email: string;
  role: "User" | "UserPro" | "Admin";
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  userName: string;
  role: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  userName: string;
  email: string;
  password: string;
}

// ─── Genres ──────────────────────────────────────────────────────────────────

export interface Genre {
  id: number;
  name: string;
  slug: string;
  songCount: number;
}

// ─── Artists ─────────────────────────────────────────────────────────────────

export interface ArtistBrief {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface Artist {
  id: number;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
}

// ─── Songs ───────────────────────────────────────────────────────────────────

export interface Song {
  id: number;
  title: string;
  /** Primary artist name (legacy, kept for compat) */
  artistName: string;
  /** Primary artist id (legacy, kept for compat) */
  artistId: number;
  /** All artists (many-to-many) */
  artists: ArtistBrief[];
  albumTitle: string | null;
  albumId: number | null;
  durationSeconds: number;
  playCount: number;
  status: string;
  coverUrl: string | null;
  description: string | null;
  lyrics: string | null;
  genres: Genre[];
  uploadedBy: number;
  uploaderName: string | null;
  uploadedAt: string;
  streamUrl: string;
}

// ─── Albums ──────────────────────────────────────────────────────────────────

export interface Album {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
  /** All artists (many-to-many) */
  artists: ArtistBrief[];
  coverUrl: string | null;
  releaseYear: number | null;
}

// ─── Playlists ───────────────────────────────────────────────────────────────

export interface Playlist {
  id: number;
  name: string;
  isPublic: boolean;
  songCount: number;
  createdAt: string;
}

export interface PlaylistDetail {
  id: number;
  name: string;
  isPublic: boolean;
  createdAt: string;
  songs: Song[];
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface StatsDto {
  totalUsers: number;
  totalSongs: number;
  totalApproved: number;
  totalPending: number;
  totalPlays: number;
  totalArtists: number;
  totalAlbums: number;
}

export interface AdminUser {
  id: number;
  userName: string;
  email: string;
  role: string;
  createdAt: string;
  songCount: number;
}

export interface AdminArtist {
  id: number;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  songCount: number;
}

export interface AdminAlbum {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
  /** All artists (many-to-many) */
  artists: ArtistBrief[];
  coverUrl: string | null;
  releaseYear: number;
  songCount: number;
}

// ─── API wrappers ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
