"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import ArtistMultiPicker from "@/components/ui/ArtistMultiPicker";
import type { Artist, Album, Genre, ApiResponse } from "@/types";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    title: "",
    albumId: "",
    description: "",
    lyrics: "",
    durationSeconds: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get<ApiResponse<Artist[]>>("/api/artists").then((r) => setArtists(r.data.data));
    api.get<ApiResponse<Genre[]>>("/api/genres").then((r) => setAllGenres(r.data.data)).catch(() => {});
  }, [user, router]);

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // Load albums when primary artist changes
  const primaryArtistId = selectedArtistIds[0];
  useEffect(() => {
    if (!primaryArtistId) { setAlbums([]); return; }
    api
      .get<ApiResponse<Album[]>>(`/api/albums/by-artist/${primaryArtistId}`)
      .then((r) => setAlbums(r.data.data))
      .catch(() => setAlbums([]));
  }, [primaryArtistId]);

  // Cover image handler
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
  };

  // Auto-detect duration from audio file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    // Suggest title from filename
    if (!form.title) {
      const name = f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setForm((prev) => ({ ...prev, title: name }));
    }

    // Detect duration via Web Audio API
    const url = URL.createObjectURL(f);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      setForm((prev) => ({
        ...prev,
        durationSeconds: Math.round(audio.duration),
      }));
      URL.revokeObjectURL(url);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setResult({ status: "error", message: "Chưa chọn file nhạc." }); return; }
    if (selectedArtistIds.length === 0) { setResult({ status: "error", message: "Chưa chọn ca sĩ." }); return; }
    if (form.durationSeconds <= 0) { setResult({ status: "error", message: "Không đọc được thời lượng bài hát." }); return; }

    setLoading(true);
    setResult(null);

    const fd = new FormData();
    fd.append("Title", form.title);
    selectedArtistIds.forEach((id) => fd.append("ArtistIds", String(id)));
    if (form.albumId)      fd.append("AlbumId",          form.albumId);
    fd.append("DurationSeconds", String(form.durationSeconds));
    if (form.description)  fd.append("Description",      form.description);
    if (form.lyrics)       fd.append("Lyrics",           form.lyrics);
    selectedGenres.forEach((id) => fd.append("GenreIds", String(id)));
    fd.append("File", file);
    if (coverFile)         fd.append("CoverFile",        coverFile);

    try {
      const res = await api.post("/api/songs", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const status = res.data.data.status;
      setResult({
        status: "success",
        message:
          status === "Approved"
            ? "✅ Bài hát đã được đăng thành công!"
            : "⏳ Bài hát đã gửi lên và đang chờ duyệt.",
      });

      // Reset form
      setForm({ title: "", albumId: "", description: "", lyrics: "", durationSeconds: 0 });
      setSelectedArtistIds([]);
      setSelectedGenres([]);
      setFile(null);
      setCoverFile(null);
      if (coverPreview) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
      if (fileRef.current) fileRef.current.value = "";
      if (coverRef.current) coverRef.current.value = "";
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Upload thất bại. Vui lòng thử lại.";
      setResult({ status: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-1">Upload bài hát</h1>
      <p className="text-sp-silver text-sm mb-6">
        {user.role === "User"
          ? "Bài hát của bạn sẽ được gửi cho Admin xét duyệt."
          : "Bài hát của bạn sẽ được duyệt ngay lập tức."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File input */}
        <div>
          <label className="text-sp-silver text-sm font-bold block mb-2">
            File nhạc *
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full bg-sp-mid rounded-lg p-6 text-center cursor-pointer border-2 border-dashed border-sp-border hover:border-sp-green transition-colors"
          >
            {file ? (
              <div>
                <p className="text-sp-green font-bold text-sm truncate">
                  🎵 {file.name}
                </p>
                <p className="text-sp-silver text-xs mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {form.durationSeconds > 0 &&
                    ` • ${Math.floor(form.durationSeconds / 60)}:${String(
                      form.durationSeconds % 60
                    ).padStart(2, "0")}`}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-3xl mb-2">☁️</p>
                <p className="text-white text-sm font-bold">
                  Nhấn để chọn file
                </p>
                <p className="text-sp-silver text-xs mt-1">
                  MP3, FLAC, WAV — tối đa 50MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".mp3,.flac,.wav"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Cover image (optional) */}
        <div>
          <label className="text-sp-silver text-sm font-bold block mb-2">
            Ảnh bìa{" "}
            <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span>
          </label>
          <div
            onClick={() => coverRef.current?.click()}
            className="w-full bg-sp-mid rounded-lg p-4 cursor-pointer border-2 border-dashed border-sp-border hover:border-sp-green transition-colors flex items-center gap-4"
          >
            {/* Preview */}
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt="Cover preview"
                className="w-16 h-16 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded bg-sp-border flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🖼️</span>
              </div>
            )}
            <div>
              <p className="text-white text-sm font-bold">
                {coverFile ? coverFile.name : "Nhấn để chọn ảnh bìa"}
              </p>
              <p className="text-sp-silver text-xs mt-0.5">
                JPG, PNG, WEBP — tối đa 5MB
              </p>
            </div>
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
          <label className="text-sp-silver text-sm font-bold block mb-1">
            Tên bài hát *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Nhập tên bài hát..."
            className="w-full bg-sp-mid text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver"
            style={{
              boxShadow:
                "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset",
            }}
          />
        </div>

        {/* Artists — multi-select */}
        <ArtistMultiPicker
          artists={artists}
          selectedIds={selectedArtistIds}
          onChange={(ids) => {
            setSelectedArtistIds(ids);
            // Clear album if primary changes
            if (ids[0] !== selectedArtistIds[0]) setForm((f) => ({ ...f, albumId: "" }));
          }}
          required
          label="Ca sĩ"
        />

        {/* Album (optional) — shown when primary artist is selected and has albums */}
        {albums.length > 0 && selectedArtistIds.length > 0 && (
          <div>
            <label className="text-sp-silver text-sm font-bold block mb-1">
              Album{" "}
              <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span>
            </label>
            <select
              value={form.albumId}
              onChange={(e) => setForm({ ...form, albumId: e.target.value })}
              className="w-full bg-sp-mid text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green"
              style={{
                boxShadow:
                  "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset",
              }}
            >
              <option value="">-- Không thuộc album --</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Genres */}
        {allGenres.length > 0 && (
          <div>
            <label className="text-sp-silver text-sm font-bold block mb-2">
              Thể loại{" "}
              <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((g) => {
                const active = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
          <label className="text-sp-silver text-sm font-bold block mb-1">
            Mô tả{" "}
            <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Mô tả ngắn về bài hát, hoàn cảnh sáng tác..."
            className="w-full bg-sp-mid text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green resize-none placeholder:text-sp-silver/60"
            style={{ boxShadow: "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset" }}
          />
        </div>

        {/* Lyrics */}
        <div>
          <label className="text-sp-silver text-sm font-bold block mb-1">
            Lời bài hát{" "}
            <span className="text-sp-silver/60 font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            value={form.lyrics}
            onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
            rows={6}
            placeholder="Nhập lời bài hát..."
            className="w-full bg-sp-mid text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green resize-y placeholder:text-sp-silver/60"
            style={{ boxShadow: "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset" }}
          />
        </div>

        {/* Duration display */}
        {form.durationSeconds > 0 && (
          <p className="text-sp-silver text-xs">
            Thời lượng phát hiện:{" "}
            <span className="text-white">
              {Math.floor(form.durationSeconds / 60)}:
              {String(form.durationSeconds % 60).padStart(2, "0")}
            </span>
          </p>
        )}

        {/* Result message */}
        {result && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-bold ${
              result.status === "success"
                ? "bg-sp-green/10 text-sp-green border border-sp-green/30"
                : "bg-sp-red/10 text-sp-red border border-sp-red/30"
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-sp-green text-sp-black font-bold py-3 rounded-pill uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {loading ? "Đang upload..." : "Upload bài hát"}
        </button>
      </form>
    </div>
  );
}
