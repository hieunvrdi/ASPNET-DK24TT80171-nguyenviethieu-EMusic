"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import { artistsLabel } from "@/lib/artists";
import ArtistMultiPicker from "@/components/ui/ArtistMultiPicker";
import type { AdminAlbum, Artist, ApiResponse } from "@/types";

// ── Edit / Create Modal ───────────────────────────────────────────────────────
interface ModalProps {
  album: AdminAlbum | null;    // null = create mode
  artists: Artist[];
  onClose: () => void;
  onSaved: (album: AdminAlbum) => void;
}

function AlbumModal({ album, artists, onClose, onSaved }: ModalProps) {
  const isEdit = album !== null;
  const coverRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title:       album?.title ?? "",
    releaseYear: album ? String(album.releaseYear) : String(new Date().getFullYear()),
  });
  // Multi-artist: init from album.artists if available, fallback to primary artistId
  const initArtistIds = album
    ? (album.artists && album.artists.length > 0
        ? album.artists.map((a) => a.id)
        : album.artistId ? [album.artistId] : [])
    : [];
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>(initArtistIds);
  const [coverFile, setCoverFile]       = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  const currentCoverSrc = coverPreview
    ?? mediaUrl(album?.coverUrl);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim())            { setError("Tên album không được để trống."); return; }
    if (selectedArtistIds.length === 0) { setError("Vui lòng chọn ít nhất 1 nghệ sĩ."); return; }
    const year = parseInt(form.releaseYear);
    if (!year || year < 1900 || year > 2100) { setError("Năm phát hành không hợp lệ."); return; }

    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("Title",       form.title.trim());
      selectedArtistIds.forEach((id) => fd.append("ArtistIds", String(id)));
      fd.append("ReleaseYear", String(year));
      if (coverFile) fd.append("CoverFile", coverFile);

      const res = isEdit
        ? await api.put<ApiResponse<AdminAlbum>>(`/api/admin/albums/${album.id}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await api.post<ApiResponse<AdminAlbum>>("/api/admin/albums", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      onSaved(res.data.data);
    } catch {
      setError("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#181818] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sp-border">
          <h2 className="text-white font-bold text-base">
            {isEdit ? "Sửa album" : "Thêm album mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-sp-silver hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Cover */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => coverRef.current?.click()}
              className="w-20 h-20 rounded-lg bg-sp-mid flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden hover:ring-2 hover:ring-sp-green transition-all"
              title="Chọn ảnh bìa"
            >
              {currentCoverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentCoverSrc} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">💿</span>
              )}
            </div>
            <div className="text-sp-silver text-xs">
              <p className="font-bold text-white text-sm mb-1">
                {form.title || "Tên album"}
              </p>
              <p>Nhấn vào ảnh để {isEdit ? "đổi" : "chọn"} ảnh bìa</p>
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
            <label className="text-sp-silver text-xs font-bold block mb-1">Tên album *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Nhập tên album..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver"
            />
          </div>

          {/* Artists — multi-select */}
          <ArtistMultiPicker
            artists={artists}
            selectedIds={selectedArtistIds}
            onChange={setSelectedArtistIds}
            required
            label="Nghệ sĩ"
          />

          {/* Release year */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Năm phát hành *</label>
            <input
              type="number"
              value={form.releaseYear}
              onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
              min={1900}
              max={2100}
              required
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green"
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
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo album"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminAlbumsPage() {
  const [albums, setAlbums]     = useState<AdminAlbum[]>([]);
  const [artists, setArtists]   = useState<Artist[]>([]);
  const [search, setSearch]     = useState("");
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [modalAlbum, setModalAlbum] = useState<AdminAlbum | null | undefined>(undefined);
  // undefined = closed, null = create mode, AdminAlbum = edit mode

  // Load artists for dropdowns
  useEffect(() => {
    api
      .get<ApiResponse<Artist[]>>("/api/artists")
      .then((r) => setArtists(r.data.data))
      .catch(() => {});
  }, []);

  // Load albums
  const load = (q: string) => {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    api
      .get<ApiResponse<AdminAlbum[]>>(`/api/admin/albums${params}`)
      .then((r) => setAlbums(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(query); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (album: AdminAlbum) => {
    if (album.songCount > 0) {
      alert(`Không thể xóa album còn ${album.songCount} bài hát. Hãy chuyển hoặc xóa bài hát trước.`);
      return;
    }
    if (!confirm(`Xóa album "${album.title}"?`)) return;
    setDeleting(album.id);
    try {
      await api.delete(`/api/admin/albums/${album.id}`);
      setAlbums((prev) => prev.filter((a) => a.id !== album.id));
    } catch {
      alert("Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (saved: AdminAlbum) => {
    setAlbums((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      // new album — prepend
      return [saved, ...prev];
    });
    setModalAlbum(undefined);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-white">Quản lý album</h1>
        <button
          onClick={() => setModalAlbum(null)}
          className="flex items-center gap-2 px-4 py-2 bg-sp-green text-sp-black font-bold rounded-full text-sm hover:brightness-110 transition-all"
        >
          + Thêm album
        </button>
      </div>
      <p className="text-sp-silver text-sm mb-6">
        {loading ? "Đang tải..." : `${albums.length} album`}
      </p>

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-silver text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm album, nghệ sĩ..."
          className="w-full bg-sp-mid text-white rounded-pill px-4 pl-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
        />
      </div>

      {/* Grid of album cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-sp-mid rounded-lg h-52 animate-pulse" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <p className="text-sp-silver text-sm">Không tìm thấy album nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              deleting={deleting === album.id}
              onEdit={() => setModalAlbum(album)}
              onDelete={() => handleDelete(album)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAlbum !== undefined && (
        <AlbumModal
          album={modalAlbum}
          artists={artists}
          onClose={() => setModalAlbum(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Album Card ────────────────────────────────────────────────────────────────
interface CardProps {
  album: AdminAlbum;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function AlbumCard({ album, deleting, onEdit, onDelete }: CardProps) {
  const coverSrc = mediaUrl(album.coverUrl);

  return (
    <div className="group bg-sp-surface rounded-lg overflow-hidden hover:bg-sp-mid transition-colors">
      {/* Cover */}
      <div className="relative aspect-square bg-sp-mid overflow-hidden">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">💿</span>
          </div>
        )}

        {/* Overlay buttons on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onEdit}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
            title="Sửa"
          >
            ✏
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="w-9 h-9 rounded-full bg-red-600/40 hover:bg-red-600/70 flex items-center justify-center text-white transition-colors disabled:opacity-50"
            title="Xóa"
          >
            {deleting ? "…" : "🗑"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-white text-sm font-bold truncate">{album.title}</p>
        <p className="text-sp-silver text-xs truncate mt-0.5">{artistsLabel(album.artists, album.artistName)}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sp-silver text-xs">{album.releaseYear}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            album.songCount > 0
              ? "bg-sp-green/20 text-sp-green"
              : "bg-sp-border text-sp-silver"
          }`}>
            {album.songCount} bài
          </span>
        </div>
      </div>
    </div>
  );
}
