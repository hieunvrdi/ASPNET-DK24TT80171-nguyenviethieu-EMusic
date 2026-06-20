"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import { songArtistsLabel } from "@/lib/artists";
import ArtistMultiPicker from "@/components/ui/ArtistMultiPicker";
import type { Song, Artist, Album, Genre, ApiResponse, PagedResult } from "@/types";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_OPTIONS = [
  { value: "",           label: "Tất cả" },
  { value: "Approved",   label: "Đã duyệt" },
  { value: "Pending",    label: "Chờ duyệt" },
  { value: "Rejected",   label: "Từ chối" },
];

const STATUS_EDIT_OPTIONS = [
  { value: "Approved", label: "Đã duyệt" },
  { value: "Pending",  label: "Chờ duyệt" },
  { value: "Rejected", label: "Từ chối" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Approved: "bg-sp-green/20 text-sp-green",
    Pending:  "bg-yellow-500/20 text-yellow-400",
    Rejected: "bg-red-500/20 text-red-400",
  };
  const labels: Record<string, string> = {
    Approved: "Đã duyệt",
    Pending:  "Chờ duyệt",
    Rejected: "Từ chối",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-sp-mid text-sp-silver"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
  song: Song;
  artists: Artist[];
  onClose: () => void;
  onSaved: (updated: Song) => void;
}

function EditModal({ song, artists, onClose, onSaved }: EditModalProps) {
  const coverRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title:       song.title,
    albumId:     song.albumId ? String(song.albumId) : "",
    status:      song.status,
    description: song.description ?? "",
    lyrics:      song.lyrics ?? "",
  });
  // Multi-artist: init from song.artists (ordered), fallback to primary artistId
  const initArtistIds = song.artists && song.artists.length > 0
    ? song.artists.map((a) => a.id)
    : song.artistId ? [song.artistId] : [];
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>(initArtistIds);
  const [albums, setAlbums]             = useState<Album[]>([]);
  const [allGenres, setAllGenres]       = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    song.genres?.map((g) => g.id) ?? []
  );
  const [coverFile, setCoverFile]       = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  // Load albums when primary artist changes
  const primaryArtistId = selectedArtistIds[0];
  useEffect(() => {
    if (!primaryArtistId) { setAlbums([]); return; }
    api
      .get<ApiResponse<Album[]>>(`/api/albums/by-artist/${primaryArtistId}`)
      .then((r) => setAlbums(r.data.data))
      .catch(() => setAlbums([]));
  }, [primaryArtistId]);

  // Load all genres once
  useEffect(() => {
    api
      .get<ApiResponse<Genre[]>>("/api/genres")
      .then((r) => setAllGenres(r.data.data))
      .catch(() => {});
  }, []);

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim())         { setError("Tên bài hát không được để trống."); return; }
    if (selectedArtistIds.length === 0) { setError("Vui lòng chọn ít nhất 1 ca sĩ."); return; }

    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("Title",       form.title.trim());
      selectedArtistIds.forEach((id) => fd.append("ArtistIds", String(id)));
      if (form.albumId)        fd.append("AlbumId", form.albumId);
      fd.append("Status",      form.status);
      if (form.description)    fd.append("Description", form.description);
      if (form.lyrics)         fd.append("Lyrics",      form.lyrics);
      selectedGenres.forEach((id) => fd.append("GenreIds", String(id)));
      if (coverFile)           fd.append("CoverFile",   coverFile);

      const res = await api.put<ApiResponse<Song>>(`/api/admin/songs/${song.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSaved(res.data.data);
    } catch {
      setError("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Current cover to show
  const currentCoverSrc = coverPreview
    ?? mediaUrl(song.coverUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#181818] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sp-border">
          <h2 className="text-white font-bold text-base">Sửa bài hát</h2>
          <button
            onClick={onClose}
            className="text-sp-silver hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Cover preview + change */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => coverRef.current?.click()}
              className="w-20 h-20 rounded-lg bg-sp-mid flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden hover:ring-2 hover:ring-sp-green transition-all"
              title="Đổi ảnh bìa"
            >
              {currentCoverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentCoverSrc} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🎵</span>
              )}
            </div>
            <div className="text-sp-silver text-xs">
              <p className="font-bold text-white text-sm mb-1">{song.title}</p>
              <p>Nhấn vào ảnh để đổi ảnh bìa</p>
              <p className="mt-0.5 opacity-60">JPG, PNG, WEBP</p>
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Tên bài hát *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green"
            />
          </div>

          {/* Artists — multi-select */}
          <ArtistMultiPicker
            artists={artists}
            selectedIds={selectedArtistIds}
            onChange={(ids) => {
              setSelectedArtistIds(ids);
              // Clear album if primary artist changes
              if (ids[0] !== selectedArtistIds[0]) setForm((f) => ({ ...f, albumId: "" }));
            }}
            required
          />

          {/* Album */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Album</label>
            <select
              value={form.albumId}
              onChange={(e) => setForm({ ...form, albumId: e.target.value })}
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green"
            >
              <option value="">-- Không thuộc album --</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green"
            >
              {STATUS_EDIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Genres */}
          {allGenres.length > 0 && (
            <div>
              <label className="text-sp-silver text-xs font-bold block mb-2">Thể loại</label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((g) => {
                  const active = selectedGenres.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? "bg-sp-green text-sp-black"
                          : "bg-sp-mid text-sp-silver hover:text-white"
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Mô tả ngắn về bài hát..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green resize-none placeholder:text-sp-silver/50"
            />
          </div>

          {/* Lyrics */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Lời bài hát</label>
            <textarea
              value={form.lyrics}
              onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
              rows={5}
              placeholder="Nhập lời bài hát..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green resize-y placeholder:text-sp-silver/50"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full bg-sp-mid text-white text-sm font-bold hover:bg-sp-card transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-full bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Song Modal ─────────────────────────────────────────────────────────
interface CreateSongModalProps {
  artists: Artist[];
  onClose: () => void;
  onCreated: (song: Song) => void;
}

function CreateSongModal({ artists, onClose, onCreated }: CreateSongModalProps) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const coverRef  = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title:       "",
    albumId:     "",
    description: "",
    lyrics:      "",
    durationSeconds: 0,
  });
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>([]);
  const [audioFile, setAudioFile]       = useState<File | null>(null);
  const [coverFile, setCoverFile]       = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [albums, setAlbums]             = useState<Album[]>([]);
  const [allGenres, setAllGenres]       = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  // Load albums when primary artist changes
  const primaryArtistId = selectedArtistIds[0];
  useEffect(() => {
    if (!primaryArtistId) { setAlbums([]); return; }
    api
      .get<ApiResponse<Album[]>>(`/api/albums/by-artist/${primaryArtistId}`)
      .then((r) => setAlbums(r.data.data))
      .catch(() => setAlbums([]));
  }, [primaryArtistId]);

  // Load genres once
  useEffect(() => {
    api
      .get<ApiResponse<Genre[]>>("/api/genres")
      .then((r) => setAllGenres(r.data.data))
      .catch(() => {});
  }, []);

  const toggleGenre = (id: number) =>
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioFile(f);
    // Auto-fill title from filename
    if (!form.title) {
      const name = f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setForm((prev) => ({ ...prev, title: name }));
    }
    // Auto-detect duration
    const url = URL.createObjectURL(f);
    const a = new Audio(url);
    a.addEventListener("loadedmetadata", () => {
      setForm((prev) => ({ ...prev, durationSeconds: Math.round(a.duration) }));
      URL.revokeObjectURL(url);
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile)                      { setError("Chưa chọn file nhạc."); return; }
    if (!form.title.trim())              { setError("Tên bài hát không được để trống."); return; }
    if (selectedArtistIds.length === 0)  { setError("Vui lòng chọn ít nhất 1 ca sĩ."); return; }
    if (form.durationSeconds <= 0)       { setError("Không đọc được thời lượng. Hãy thử lại."); return; }

    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("Title",           form.title.trim());
      selectedArtistIds.forEach((id) => fd.append("ArtistIds", String(id)));
      if (form.albumId)            fd.append("AlbumId",      form.albumId);
      fd.append("DurationSeconds", String(form.durationSeconds));
      if (form.description)        fd.append("Description",  form.description);
      if (form.lyrics)             fd.append("Lyrics",       form.lyrics);
      selectedGenres.forEach((id) => fd.append("GenreIds",   String(id)));
      fd.append("File",            audioFile);
      if (coverFile)               fd.append("CoverFile",    coverFile);

      const res = await api.post<ApiResponse<Song>>("/api/songs", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onCreated(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Thêm bài hát thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#181818] rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sp-border flex-shrink-0">
          <h2 className="text-white font-bold text-base">Thêm bài hát mới</h2>
          <button onClick={onClose} className="text-sp-silver hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Audio file */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">File nhạc *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full bg-sp-mid rounded-lg p-4 text-center cursor-pointer border-2 border-dashed border-sp-border hover:border-sp-green transition-colors"
            >
              {audioFile ? (
                <div>
                  <p className="text-sp-green font-bold text-sm truncate">🎵 {audioFile.name}</p>
                  <p className="text-sp-silver text-xs mt-0.5">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    {form.durationSeconds > 0 && ` · ${Math.floor(form.durationSeconds / 60)}:${String(form.durationSeconds % 60).padStart(2, "0")}`}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl mb-1">☁️</p>
                  <p className="text-white text-sm font-bold">Nhấn để chọn file nhạc</p>
                  <p className="text-sp-silver text-xs mt-0.5">MP3, FLAC, WAV · tối đa 50MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".mp3,.flac,.wav" onChange={handleAudioChange} className="hidden" />
          </div>

          {/* Cover image */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => coverRef.current?.click()}
              className="w-16 h-16 rounded-lg bg-sp-mid flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden hover:ring-2 hover:ring-sp-green transition-all"
              title="Chọn ảnh bìa"
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🖼️</span>
              )}
            </div>
            <div className="text-sp-silver text-xs">
              <p className="text-white text-sm font-bold mb-0.5">Ảnh bìa <span className="text-sp-silver font-normal">(tuỳ chọn)</span></p>
              <p>Nhấn vào khung để chọn ảnh</p>
              <p className="opacity-60">JPG, PNG, WebP</p>
            </div>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} className="hidden" />
          </div>

          {/* Title */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Tên bài hát *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Nhập tên bài hát..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/50"
            />
          </div>

          {/* Artists — multi-select */}
          <ArtistMultiPicker
            artists={artists}
            selectedIds={selectedArtistIds}
            onChange={(ids) => {
              setSelectedArtistIds(ids);
              if (ids[0] !== selectedArtistIds[0]) setForm((f) => ({ ...f, albumId: "" }));
            }}
            required
          />

          {/* Album */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Album <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span></label>
            <select
              value={form.albumId}
              onChange={(e) => setForm({ ...form, albumId: e.target.value })}
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green"
            >
              <option value="">-- Không thuộc album --</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Genres */}
          {allGenres.length > 0 && (
            <div>
              <label className="text-sp-silver text-xs font-bold block mb-2">Thể loại <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span></label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((g) => {
                  const active = selectedGenres.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        active ? "bg-sp-green text-sp-black" : "bg-sp-mid text-sp-silver hover:text-white"
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Mô tả <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Mô tả ngắn về bài hát..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green resize-none placeholder:text-sp-silver/50"
            />
          </div>

          {/* Lyrics */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Lời bài hát <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span></label>
            <textarea
              value={form.lyrics}
              onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
              rows={5}
              placeholder="Nhập lời bài hát..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green resize-y placeholder:text-sp-silver/50"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full bg-sp-mid text-white text-sm font-bold hover:bg-sp-card transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-full bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Đang tải lên..." : "Thêm bài hát"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminSongsPage() {
  const [songs, setSongs]       = useState<Song[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [query, setQuery]       = useState("");
  const [status, setStatus]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [approving, setApproving] = useState<number | null>(null);
  const [editingSong, setEditingSong]   = useState<Song | null>(null);
  const [createOpen, setCreateOpen]     = useState(false);
  const [artists, setArtists]           = useState<Artist[]>([]);

  const pageSize = 20;

  // Load artists for the edit modal dropdown
  useEffect(() => {
    api
      .get<ApiResponse<Artist[]>>("/api/artists")
      .then((r) => setArtists(r.data.data))
      .catch(() => {});
  }, []);

  const load = useCallback((p: number, q: string, st: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p),
      pageSize: String(pageSize),
    });
    if (q)  params.set("search", q);
    if (st) params.set("status", st);

    api
      .get<PagedResult<Song>>(`/api/admin/songs?${params}`)
      .then((r) => {
        setSongs(r.data.data);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load(page, query, status);
  }, [page, query, status, load]);

  const handleDelete = async (song: Song) => {
    if (!confirm(`Xóa bài hát "${song.title}"? Thao tác không thể hoàn tác.`)) return;
    setDeleting(song.id);
    try {
      await api.delete(`/api/admin/songs/${song.id}`);
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
      setTotal((t) => t - 1);
    } catch {
      alert("Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  const handleApprove = async (song: Song) => {
    setApproving(song.id);
    try {
      await api.patch(`/api/admin/songs/${song.id}/approve`);
      setSongs((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, status: "Approved" } : s))
      );
    } catch {
      alert("Duyệt thất bại.");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (song: Song) => {
    setApproving(song.id);
    try {
      await api.patch(`/api/admin/songs/${song.id}/reject`);
      setSongs((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, status: "Rejected" } : s))
      );
    } catch {
      alert("Từ chối thất bại.");
    } finally {
      setApproving(null);
    }
  };

  const handleSaved = (updated: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingSong(null);
  };

  const handleCreated = (newSong: Song) => {
    setSongs((prev) => [newSong, ...prev]);
    setTotal((t) => t + 1);
    setCreateOpen(false);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý bài hát</h1>
          <p className="text-sp-silver text-sm mt-0.5">
            {loading ? "Đang tải..." : `${total} bài hát`}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-5 py-2 rounded-full bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all flex-shrink-0"
        >
          + Thêm bài hát
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mt-5 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-silver text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm bài hát, nghệ sĩ..."
            className="w-full bg-sp-mid text-white rounded-pill px-4 pl-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
          />
        </div>
        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-sp-mid text-white rounded-pill px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-sp-surface rounded-lg overflow-x-auto">
        <div className="min-w-[720px]">
        <div className="grid grid-cols-[40px_1fr_140px_80px_100px_120px_160px] gap-3 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
          <span>#</span>
          <span>Tiêu đề / Nghệ sĩ</span>
          <span>Người upload</span>
          <span className="text-right">Thời lượng</span>
          <span className="text-right">Lượt nghe</span>
          <span>Trạng thái</span>
          <span className="text-right">Hành động</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sp-silver text-sm">Đang tải...</div>
        ) : songs.length === 0 ? (
          <div className="p-8 text-center text-sp-silver text-sm">Không có bài hát nào.</div>
        ) : (
          songs.map((song, i) => (
            <div
              key={song.id}
              className="grid grid-cols-[40px_1fr_140px_80px_100px_120px_160px] gap-3 px-4 py-3 items-center border-b border-sp-border/50 hover:bg-sp-mid/30 transition-colors"
            >
              {/* # */}
              <span className="text-sp-silver text-sm">
                {(page - 1) * pageSize + i + 1}
              </span>

              {/* Title + Artist */}
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{song.title}</p>
                <p className="text-sp-silver text-xs truncate">{songArtistsLabel(song)}</p>
              </div>

              {/* Uploader */}
              <p className="text-sp-silver text-xs truncate">{song.uploaderName ?? "—"}</p>

              {/* Duration */}
              <p className="text-sp-silver text-sm text-right">{fmt(song.durationSeconds)}</p>

              {/* Play count */}
              <p className="text-sp-silver text-sm text-right">{song.playCount.toLocaleString()}</p>

              {/* Status */}
              <div><StatusBadge status={song.status} /></div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end flex-wrap">
                {/* Edit */}
                <button
                  onClick={() => setEditingSong(song)}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors"
                  title="Sửa"
                >
                  ✏
                </button>

                {song.status === "Pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(song)}
                      disabled={approving === song.id}
                      className="px-2 py-1 bg-sp-green/20 text-sp-green text-xs rounded hover:bg-sp-green/30 transition-colors disabled:opacity-50"
                      title="Duyệt"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleReject(song)}
                      disabled={approving === song.id}
                      className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      title="Từ chối"
                    >
                      ✕
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(song)}
                  disabled={deleting === song.id}
                  className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/40 transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  {deleting === song.id ? "..." : "🗑"}
                </button>
              </div>
            </div>
          ))
        )}
        </div>{/* /min-w */}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-1.5 rounded-pill bg-sp-mid text-white text-sm disabled:opacity-40 hover:bg-sp-card transition-colors"
          >
            ‹
          </button>
          <span className="text-sp-silver text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-1.5 rounded-pill bg-sp-mid text-white text-sm disabled:opacity-40 hover:bg-sp-card transition-colors"
          >
            ›
          </button>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <CreateSongModal
          artists={artists}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Edit modal */}
      {editingSong && (
        <EditModal
          song={editingSong}
          artists={artists}
          onClose={() => setEditingSong(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
