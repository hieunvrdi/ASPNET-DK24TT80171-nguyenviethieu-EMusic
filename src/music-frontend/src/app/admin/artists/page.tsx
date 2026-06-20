"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { mediaUrl } from "@/lib/media";
import type { AdminArtist, ApiResponse } from "@/types";

// ── Shared Modal ──────────────────────────────────────────────────────────────
interface ArtistModalProps {
  artist: AdminArtist | null; // null = create
  onClose: () => void;
  onSaved: (saved: AdminArtist) => void;
}

function ArtistModal({ artist, onClose, onSaved }: ArtistModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName]     = useState(artist?.name ?? "");
  const [bio, setBio]       = useState(artist?.bio ?? "");
  const [file, setFile]     = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const existingAvatar = artist ? mediaUrl(artist.avatarUrl) : null;
  const avatarSrc = preview ?? existingAvatar;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Tên ca sĩ không được để trống."); return; }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("Name", name.trim());
      if (bio.trim()) fd.append("Bio", bio.trim());
      if (file) fd.append("AvatarFile", file);

      let res;
      if (artist) {
        res = await api.put<ApiResponse<AdminArtist>>(
          `/api/admin/artists/${artist.id}`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        res = await api.post<ApiResponse<AdminArtist>>(
          "/api/artists",
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      onSaved(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#181818] rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sp-border flex-shrink-0">
          <h2 className="text-white font-bold text-base">
            {artist ? "Chỉnh sửa ca sĩ" : "Thêm ca sĩ mới"}
          </h2>
          <button onClick={onClose} className="text-sp-silver hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full bg-sp-mid flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden hover:ring-2 hover:ring-sp-green transition-all"
              title="Chọn ảnh đại diện"
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🎤</span>
              )}
            </div>
            <div className="text-sp-silver text-xs">
              <p className="text-white text-sm font-bold mb-1">Ảnh đại diện</p>
              <p>Nhấn vào ảnh để chọn file</p>
              <p className="opacity-60 mt-0.5">JPG, PNG, WebP · tối đa 5MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Tên ca sĩ *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nhập tên ca sĩ..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/50"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Tiểu sử</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Giới thiệu về ca sĩ..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green resize-none placeholder:text-sp-silver/50"
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
              {saving ? "Đang lưu..." : artist ? "Lưu thay đổi" : "Thêm ca sĩ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminArtistsPage() {
  const [artists, setArtists]   = useState<AdminArtist[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [modalArtist, setModalArtist] = useState<AdminArtist | null | "new">(undefined as unknown as null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]     = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<ApiResponse<AdminArtist[]>>("/api/admin/artists")
      .then((r) => setArtists(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = artists.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (artist: AdminArtist) => {
    if (artist.songCount > 0) {
      alert(`Không thể xóa ca sĩ còn ${artist.songCount} bài hát. Hãy xóa bài hát trước.`);
      return;
    }
    if (!confirm(`Xóa ca sĩ "${artist.name}"?`)) return;
    setDeleting(artist.id);
    try {
      await api.delete(`/api/admin/artists/${artist.id}`);
      setArtists((prev) => prev.filter((a) => a.id !== artist.id));
    } catch {
      alert("Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => {
    setModalArtist(null);
    setModalOpen(true);
  };

  const openEdit = (artist: AdminArtist) => {
    setModalArtist(artist);
    setModalOpen(true);
  };

  const handleSaved = (saved: AdminArtist) => {
    setArtists((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setModalOpen(false);
    setModalArtist(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý ca sĩ</h1>
          <p className="text-sp-silver text-sm mt-0.5">
            {loading ? "Đang tải..." : `${artists.length} ca sĩ`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2 rounded-full bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all"
        >
          + Thêm ca sĩ
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mt-5 mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-silver text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm ca sĩ..."
          className="w-full bg-sp-mid text-white rounded-full px-4 pl-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
        />
      </div>

      {/* Table */}
      <div className="bg-sp-surface rounded-lg overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[56px_1fr_180px_70px_140px] gap-4 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
            <span>Ảnh</span>
            <span>Tên ca sĩ</span>
            <span>Tiểu sử</span>
            <span className="text-right">Bài hát</span>
            <span className="text-right">Hành động</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sp-silver text-sm">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sp-silver text-sm">
              {search ? "Không tìm thấy ca sĩ nào." : "Chưa có ca sĩ nào."}
            </div>
          ) : (
            filtered.map((artist) => (
              <div
                key={artist.id}
                className="grid grid-cols-[56px_1fr_180px_70px_140px] gap-4 px-4 py-3 items-center border-b border-sp-border/50 hover:bg-sp-mid/30 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-sp-mid flex items-center justify-center overflow-hidden flex-shrink-0">
                  {artist.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(artist.avatarUrl)!}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🎤</span>
                  )}
                </div>

                {/* Name */}
                <p className="text-white text-sm font-bold truncate">{artist.name}</p>

                {/* Bio */}
                <p className="text-sp-silver text-xs truncate">
                  {artist.bio
                    ? artist.bio.slice(0, 60) + (artist.bio.length > 60 ? "…" : "")
                    : "—"}
                </p>

                {/* Song count */}
                <p className="text-sp-silver text-sm text-right">{artist.songCount}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => openEdit(artist)}
                    className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors"
                    title="Sửa"
                  >
                    ✏ Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(artist)}
                    disabled={deleting === artist.id}
                    className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/40 transition-colors disabled:opacity-50"
                    title="Xóa"
                  >
                    {deleting === artist.id ? "..." : "🗑 Xóa"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ArtistModal
          artist={modalArtist as AdminArtist | null}
          onClose={() => { setModalOpen(false); setModalArtist(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
