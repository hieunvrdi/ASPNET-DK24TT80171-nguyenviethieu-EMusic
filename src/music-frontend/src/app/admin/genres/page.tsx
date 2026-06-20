"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Genre, ApiResponse } from "@/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface GenreModalProps {
  genre: Genre | null; // null = create new
  onClose: () => void;
  onSaved: (genre: Genre) => void;
}

function GenreModal({ genre, onClose, onSaved }: GenreModalProps) {
  const [name, setName] = useState(genre?.name ?? "");
  const [slug, setSlug] = useState(genre?.slug ?? "");
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from name (unless manually edited)
  useEffect(() => {
    if (!slugManual) setSlug(slugify(name));
  }, [name, slugManual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Tên thể loại không được để trống."); return; }
    if (!slug.trim()) { setError("Slug không được để trống."); return; }
    setSaving(true);
    setError("");
    try {
      if (genre) {
        // Update
        const res = await api.put<ApiResponse<Genre>>(`/api/admin/genres/${genre.id}`, { name: name.trim(), slug: slug.trim() });
        onSaved(res.data.data);
      } else {
        // Create
        const res = await api.post<ApiResponse<Genre>>("/api/admin/genres", { name: name.trim(), slug: slug.trim() });
        onSaved(res.data.data);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#181818] rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sp-border">
          <h2 className="text-white font-bold text-base">
            {genre ? "Sửa thể loại" : "Thêm thể loại"}
          </h2>
          <button onClick={onClose} className="text-sp-silver hover:text-white text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Tên thể loại *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ví dụ: Pop, Rock, V-Pop..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/50"
            />
          </div>
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
              required
              placeholder="vi-du: pop, rock, v-pop"
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/50"
            />
            <p className="text-sp-silver/50 text-xs mt-1">Tự động tạo từ tên (có thể chỉnh sửa)</p>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

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
              {saving ? "Đang lưu..." : genre ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<ApiResponse<Genre[]>>("/api/genres")
      .then((r) => setGenres(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = genres.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (genre: Genre) => {
    if (!confirm(`Xóa thể loại "${genre.name}"? Thao tác không thể hoàn tác.`)) return;
    setDeleting(genre.id);
    try {
      await api.delete(`/api/admin/genres/${genre.id}`);
      setGenres((prev) => prev.filter((g) => g.id !== genre.id));
    } catch {
      alert("Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (saved: Genre) => {
    setGenres((prev) => {
      const idx = prev.findIndex((g) => g.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setModalOpen(false);
    setEditingGenre(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý thể loại</h1>
          <p className="text-sp-silver text-sm mt-0.5">
            {loading ? "Đang tải..." : `${genres.length} thể loại`}
          </p>
        </div>
        <button
          onClick={() => { setEditingGenre(null); setModalOpen(true); }}
          className="px-5 py-2 rounded-full bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all"
        >
          + Thêm thể loại
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mt-6 mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-silver text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm thể loại..."
          className="w-full bg-sp-mid text-white rounded-full px-4 pl-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
        />
      </div>

      {/* Table */}
      <div className="bg-sp-surface rounded-lg overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_160px_80px_120px] gap-3 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
          <span>#</span>
          <span>Tên thể loại</span>
          <span>Slug</span>
          <span className="text-right">Số bài</span>
          <span className="text-right">Hành động</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sp-silver text-sm">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sp-silver text-sm">
            {search ? "Không tìm thấy thể loại nào." : "Chưa có thể loại nào."}
          </div>
        ) : (
          filtered.map((genre, i) => (
            <div
              key={genre.id}
              className="grid grid-cols-[40px_1fr_160px_80px_120px] gap-3 px-4 py-3 items-center border-b border-sp-border/50 hover:bg-sp-mid/30 transition-colors"
            >
              <span className="text-sp-silver text-sm">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{genre.name}</p>
              </div>
              <p className="text-sp-silver text-xs font-mono truncate">{genre.slug}</p>
              <p className="text-sp-silver text-sm text-right">{genre.songCount}</p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setEditingGenre(genre); setModalOpen(true); }}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors"
                  title="Sửa"
                >
                  ✏
                </button>
                <button
                  onClick={() => handleDelete(genre)}
                  disabled={deleting === genre.id}
                  className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/40 transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  {deleting === genre.id ? "..." : "🗑"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <GenreModal
          genre={editingGenre}
          onClose={() => { setModalOpen(false); setEditingGenre(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
