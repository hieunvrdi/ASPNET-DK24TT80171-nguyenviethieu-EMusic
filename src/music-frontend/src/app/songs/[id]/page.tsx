"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import { songArtistsLabel } from "@/lib/artists";
import { usePlayerStore } from "@/store/playerStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useAuthStore } from "@/store/authStore";
import type { Song, Artist, ApiResponse, PagedResult } from "@/types";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Lyrics inner (collapsible content, no title — title is in parent) ─────────
function LyricsInner({ lyrics }: { lyrics: string }) {
  const lines = lyrics.split("\n");
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 8;
  const hasMore = lines.length > PREVIEW;
  const shown = expanded ? lines : lines.slice(0, PREVIEW);

  return (
    <div className="relative">
      <div className={`relative ${!expanded && hasMore ? "max-h-[200px] overflow-hidden" : ""}`}>
        <pre className="text-sp-silver text-sm leading-loose whitespace-pre-wrap font-sans">
          {shown.join("\n")}
        </pre>
        {/* Fade gradient when collapsed */}
        {!expanded && hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-sp-surface to-transparent pointer-events-none" />
        )}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-white text-sm font-bold hover:text-sp-green transition-colors flex items-center gap-1"
        >
          {expanded ? "Thu gọn ▲" : "Xem thêm ▼"}
        </button>
      )}
    </div>
  );
}

// ── Artist sidebar card ───────────────────────────────────────────────────────
function ArtistCard({ artist, songCount }: { artist: Artist; songCount: number }) {
  const avatarSrc = mediaUrl(artist.avatarUrl);
  return (
    <div className="bg-sp-surface rounded-2xl p-5">
      <h2 className="text-white font-bold text-base mb-4">Nghệ sĩ</h2>
      <div className="flex flex-col items-center text-center">
        <Link href={`/artists/${artist.id}`}>
          <div className="w-24 h-24 rounded-full bg-sp-mid overflow-hidden mb-3 hover:ring-2 hover:ring-sp-green transition-all flex-shrink-0">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🎤</div>
            )}
          </div>
        </Link>
        <Link href={`/artists/${artist.id}`} className="text-white font-bold text-base hover:underline mb-1">
          {artist.name}
        </Link>
        <p className="text-sp-silver text-xs mb-4">{songCount} bài hát</p>
        {artist.bio && (
          <p className="text-sp-silver text-xs text-left leading-relaxed mb-4 line-clamp-4">
            {artist.bio}
          </p>
        )}
        <Link
          href={`/artists/${artist.id}`}
          className="px-5 py-2 rounded-full border border-sp-silver/40 text-white text-xs font-bold hover:border-white transition-colors"
        >
          Xem trang nghệ sĩ
        </Link>
      </div>
    </div>
  );
}

// ── Mini song row ─────────────────────────────────────────────────────────────
function SongRow({
  song,
  queue,
}: {
  song: Song;
  queue: Song[];
}) {
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const isActive = currentSong?.id === song.id;
  const cover = mediaUrl(song.coverUrl);

  const handleClick = () => {
    if (isActive) togglePlay();
    else play(song, queue);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer group transition-colors hover:bg-sp-mid ${
        isActive ? "bg-sp-mid/50" : ""
      }`}
    >
      {/* Cover + index */}
      <div className="w-10 h-10 rounded bg-sp-mid flex-shrink-0 overflow-hidden relative">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base">🎵</div>
        )}
        {/* Hover/active overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <span className="text-white text-sm">{isActive && isPlaying ? "⏸" : "▶"}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isActive ? "text-sp-green" : "text-white"}`}>
          {song.title}
        </p>
        <p className="text-xs text-sp-silver truncate">{songArtistsLabel(song)} · {song.playCount.toLocaleString()} lượt nghe</p>
      </div>

      <span className="text-sp-silver text-xs flex-shrink-0">{fmt(song.durationSeconds)}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<ApiResponse<Song>>(`/api/songs/${id}`)
      .then(async (r) => {
        const s = r.data.data;
        setSong(s);
        // Fetch artist info + their songs in parallel
        const [artistRes, songsRes] = await Promise.all([
          api.get<ApiResponse<Artist>>(`/api/artists/${s.artistId}`).catch(() => null),
          api
            .get<PagedResult<Song>>(`/api/artists/${s.artistId}/songs?page=1&pageSize=6`)
            .catch(() => null),
        ]);
        if (artistRes) setArtist(artistRes.data.data);
        if (songsRes) {
          // Exclude current song, take top 5
          setArtistSongs(
            songsRes.data.data.filter((x) => x.id !== s.id).slice(0, 5)
          );
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="w-8 h-8 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !song) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
        <p className="text-5xl mb-4">🎵</p>
        <p className="text-white font-bold text-lg">Không tìm thấy bài hát</p>
        <p className="text-sp-silver text-sm mt-1">Bài hát không tồn tại hoặc chưa được duyệt.</p>
      </div>
    );
  }

  const isActive = currentSong?.id === song.id;
  const cover = mediaUrl(song.coverUrl);
  const favorited = isFavorite(song.id);

  const handlePlay = () => {
    if (isActive) togglePlay();
    else play(song, [song, ...artistSongs]);
  };

  return (
    <div className="pb-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Blurred background */}
        {cover && (
          <div
            className="absolute inset-0 scale-110 blur-2xl opacity-30"
            style={{ backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sp-black/60 to-sp-black" />

        <div className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
          {/* Cover */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-sp-mid flex-shrink-0 overflow-hidden shadow-2xl mx-auto sm:mx-0">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={song.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">🎵</div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end text-center sm:text-left">
            <p className="text-sp-silver text-xs uppercase tracking-widest mb-2">Bài hát</p>
            <h1 className="text-white text-2xl sm:text-4xl font-extrabold leading-tight mb-3 drop-shadow-lg">
              {song.title}
            </h1>

            {/* Artist row — all artists */}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 justify-center sm:justify-start mb-3">
              {(song.artists && song.artists.length > 0 ? song.artists : [{ id: song.artistId, name: song.artistName, avatarUrl: null }]).map((a, idx) => (
                <span key={a.id} className="inline-flex items-center gap-1.5">
                  {idx === 1 && <span className="text-sp-silver text-xs">ft.</span>}
                  {idx > 1 && <span className="text-sp-silver text-xs">,</span>}
                  <Link
                    href={`/artists/${a.id}`}
                    className="inline-flex items-center gap-1.5 group"
                  >
                    {idx === 0 && (artist && mediaUrl(artist.avatarUrl)) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(artist.avatarUrl)!}
                        alt={a.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : idx === 0 ? (
                      <span className="text-base">🎤</span>
                    ) : null}
                    <span className="text-white text-sm font-bold group-hover:underline">
                      {a.name}
                    </span>
                  </Link>
                </span>
              ))}
            </div>

            {/* Meta */}
            <p className="text-sp-silver text-xs mb-5">
              {song.playCount.toLocaleString()} lượt nghe
              {song.albumTitle && <> · {song.albumTitle}</>}
              {" · "}{fmt(song.durationSeconds)}
            </p>

            {/* Genre badges */}
            {song.genres && song.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mb-5">
                {song.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-sp-silver border border-white/10"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
              {/* Play */}
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-sp-green text-sp-black text-sm font-extrabold hover:brightness-110 hover:scale-105 transition-all shadow-lg"
              >
                <span>{isActive && isPlaying ? "⏸" : "▶"}</span>
                {isActive && isPlaying ? "Tạm dừng" : "Phát"}
              </button>

              {/* Favorite */}
              {user && (
                <button
                  onClick={() => toggleFavorite(song.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold border transition-all ${
                    favorited
                      ? "bg-sp-green/10 border-sp-green text-sp-green"
                      : "border-sp-silver/30 text-sp-silver hover:border-white hover:text-white"
                  }`}
                >
                  <span>{favorited ? "♥" : "♡"}</span>
                  <span className="hidden sm:inline">{favorited ? "Đã thích" : "Yêu thích"}</span>
                </button>
              )}

              {/* Share stub */}
              <button
                title="Chia sẻ"
                className="w-11 h-11 rounded-full border border-sp-silver/30 text-sp-silver hover:border-white hover:text-white transition-colors flex items-center justify-center text-lg"
              >
                ↗
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-8 mt-4">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Description — always visible */}
            <div className="bg-sp-surface rounded-2xl p-5">
              <h2 className="text-white font-bold text-base mb-3">Mô tả</h2>
              {song.description ? (
                <p className="text-sp-silver text-sm leading-relaxed whitespace-pre-wrap">
                  {song.description}
                </p>
              ) : (
                <p className="text-sp-silver/40 text-sm italic">Chưa có thông tin</p>
              )}
            </div>

            {/* Lyrics — always visible */}
            <div className="bg-sp-surface rounded-2xl p-5">
              <h2 className="text-white font-bold text-base mb-3">Lời bài hát</h2>
              {song.lyrics ? (
                <LyricsInner lyrics={song.lyrics} />
              ) : (
                <p className="text-sp-silver/40 text-sm italic">Chưa có thông tin</p>
              )}
            </div>

            {/* Popular songs by artist */}
            {artistSongs.length > 0 && (
              <div className="bg-sp-surface rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold text-base">
                    Bài hát nổi bật của{" "}
                    <Link
                      href={`/artists/${song.artistId}`}
                      className="text-sp-green hover:underline"
                    >
                      {songArtistsLabel(song)}
                    </Link>
                  </h2>
                  <Link
                    href={`/artists/${song.artistId}`}
                    className="text-sp-silver text-xs hover:text-white transition-colors"
                  >
                    Xem tất cả ›
                  </Link>
                </div>
                <div className="space-y-1">
                  {artistSongs.map((s) => (
                    <SongRow key={s.id} song={s} queue={[song, ...artistSongs]} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — Artist card + Meta */}
          <div className="w-full lg:w-72 space-y-4 flex-shrink-0">
            {/* Artist card */}
            {artist && (
              <ArtistCard artist={artist} songCount={artistSongs.length + 1} />
            )}

            {/* Song meta */}
            <div className="bg-sp-surface rounded-2xl p-5 space-y-3 text-sm">
              <h2 className="text-white font-bold text-base mb-1">Thông tin</h2>
              {song.albumTitle && (
                <div className="flex justify-between gap-2">
                  <span className="text-sp-silver">Album</span>
                  <span className="text-white font-medium text-right">{song.albumTitle}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-sp-silver">Thời lượng</span>
                <span className="text-white font-medium">{fmt(song.durationSeconds)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-sp-silver">Lượt nghe</span>
                <span className="text-white font-medium">{song.playCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-sp-silver">Ngày đăng</span>
                <span className="text-white font-medium">
                  {new Date(song.uploadedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {song.uploaderName && (
                <div className="flex justify-between gap-2">
                  <span className="text-sp-silver">Người đăng</span>
                  <span className="text-white font-medium">{song.uploaderName}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-sp-silver">Trạng thái</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    song.status === "Approved"
                      ? "bg-sp-green/20 text-sp-green"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {song.status === "Approved" ? "Đã duyệt" : "Chờ duyệt"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
