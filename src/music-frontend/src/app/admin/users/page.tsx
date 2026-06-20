"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import type { AdminUser, ApiResponse } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLES = ["User", "UserPro", "Admin"] as const;
type Role = (typeof ROLES)[number];

const roleBadge: Record<string, string> = {
  Admin:   "bg-red-500/15 text-red-400 border-red-500/30",
  UserPro: "bg-sp-green/15 text-sp-green border-sp-green/30",
  User:    "bg-sp-border/30 text-sp-silver border-sp-border",
};

const roleLabel: Record<string, string> = {
  Admin:   "Admin",
  UserPro: "Pro",
  User:    "User",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${roleBadge[role] ?? roleBadge["User"]}`}>
      {roleLabel[role] ?? role}
    </span>
  );
}

// ── User Modal (Create / Edit) ────────────────────────────────────────────────
interface UserModalProps {
  user: AdminUser | null;   // null = create
  onClose: () => void;
  onSaved: (u: AdminUser) => void;
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
  const [form, setForm] = useState({
    userName:    user?.userName ?? "",
    email:       user?.email ?? "",
    role:        (user?.role ?? "User") as Role,
    password:    "",
    showPassword: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userName.trim()) { setError("Tên người dùng không được để trống."); return; }
    if (!form.email.trim())    { setError("Email không được để trống."); return; }
    if (!user && form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự."); return;
    }
    if (user && form.password && form.password.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự."); return;
    }
    setSaving(true);
    setError("");
    try {
      if (user) {
        const body: Record<string, string> = {
          userName: form.userName.trim(),
          email:    form.email.trim(),
          role:     form.role,
        };
        if (form.password) body.newPassword = form.password;
        const res = await api.put<ApiResponse<AdminUser>>(`/api/admin/users/${user.id}`, body);
        onSaved(res.data.data);
      } else {
        const res = await api.post<ApiResponse<AdminUser>>("/api/admin/users", {
          userName: form.userName.trim(),
          email:    form.email.trim(),
          password: form.password,
          role:     form.role,
        });
        onSaved(res.data.data);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const f = (field: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#181818] rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sp-border flex-shrink-0">
          <h2 className="text-white font-bold text-base">
            {user ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
          </h2>
          <button onClick={onClose} className="text-sp-silver hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Avatar preview (initial letter) */}
          <div className="flex justify-center mb-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sp-green/40 to-sp-green/10 flex items-center justify-center border border-sp-green/20">
              <span className="text-white font-extrabold text-2xl uppercase">
                {form.userName[0] || "?"}
              </span>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Tên người dùng *</label>
            <input
              type="text"
              value={form.userName}
              onChange={(e) => f("userName", e.target.value)}
              required
              placeholder="username..."
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => f("email", e.target.value)}
              required
              placeholder="email@example.com"
              className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/50"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-2">Vai trò</label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: r }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    form.role === r
                      ? r === "Admin"
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : r === "UserPro"
                        ? "bg-sp-green/20 border-sp-green/50 text-sp-green"
                        : "bg-sp-mid border-sp-silver/50 text-white"
                      : "border-sp-border text-sp-silver hover:border-sp-silver/50 hover:text-white"
                  }`}
                >
                  {roleLabel[r]}
                </button>
              ))}
            </div>
            <p className="text-sp-silver/50 text-xs mt-1.5">
              {form.role === "Admin" && "Toàn quyền quản trị hệ thống"}
              {form.role === "UserPro" && "Upload nhạc không cần duyệt"}
              {form.role === "User" && "Upload nhạc cần Admin duyệt"}
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="text-sp-silver text-xs font-bold block mb-1">
              {user ? "Mật khẩu mới" : "Mật khẩu *"}
              {user && <span className="text-sp-silver/50 font-normal ml-1">(để trống = giữ nguyên)</span>}
            </label>
            <div className="relative">
              <input
                type={form.showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => f("password", e.target.value)}
                required={!user}
                placeholder={user ? "Nhập mật khẩu mới nếu muốn đổi..." : "Tối thiểu 6 ký tự..."}
                className="w-full bg-sp-mid text-white rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-sp-green placeholder:text-sp-silver/50"
              />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, showPassword: !p.showPassword }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sp-silver hover:text-white text-xs"
              >
                {form.showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded">{error}</p>}

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
              {saving ? "Đang lưu..." : user ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuthStore();

  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalUser, setModalUser]   = useState<AdminUser | null | "new">("new" as unknown as null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleting, setDeleting]     = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get<ApiResponse<AdminUser[]>>("/api/admin/users")
      .then((r) => setUsers(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.userName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setModalUser(null);
    setModalOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setModalUser(u);
    setModalOpen(true);
  };

  const handleSaved = (saved: AdminUser) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setModalOpen(false);
    setModalUser(null);
  };

  const handleDelete = async (u: AdminUser) => {
    if (u.id === currentAdmin?.id) {
      alert("Không thể xóa tài khoản của chính mình.");
      return;
    }
    if (u.songCount > 0) {
      if (
        !confirm(
          `Người dùng "${u.userName}" còn ${u.songCount} bài hát.\nBạn phải xóa bài hát trước.\nTiếp tục?`
        )
      )
        return;
      alert("Vui lòng xóa tất cả bài hát của người dùng này trước khi xóa tài khoản.");
      return;
    }
    if (!confirm(`Xóa tài khoản "${u.userName}"? Thao tác không thể hoàn tác.`)) return;

    setDeleting(u.id);
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? "Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Người dùng</h1>
          <p className="text-sp-silver text-sm mt-0.5">
            {loading ? "Đang tải..." : `${users.length} tài khoản`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2 rounded-full bg-sp-green text-sp-black text-sm font-bold hover:brightness-110 transition-all"
        >
          + Thêm người dùng
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mt-5 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-silver text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, email..."
            className="w-full bg-sp-mid text-white rounded-full px-4 pl-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-sp-mid text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white"
        >
          <option value="">Tất cả vai trò</option>
          <option value="Admin">Admin</option>
          <option value="UserPro">Pro</option>
          <option value="User">User</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-sp-surface rounded-lg overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Header row */}
          <div className="grid grid-cols-[32px_1fr_1fr_90px_64px_140px] gap-3 px-4 py-2 text-xs text-sp-silver uppercase tracking-widest border-b border-sp-border">
            <span>#</span>
            <span>Tên người dùng</span>
            <span>Email</span>
            <span>Vai trò</span>
            <span className="text-right">Bài hát</span>
            <span className="text-right">Hành động</span>
          </div>

          {loading ? (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-sp-mid/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sp-silver text-sm">
              {search || roleFilter ? "Không tìm thấy người dùng nào." : "Chưa có người dùng nào."}
            </div>
          ) : (
            filtered.map((u, i) => {
              const isSelf = u.id === currentAdmin?.id;
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[32px_1fr_1fr_90px_64px_140px] gap-3 px-4 py-3 items-center border-b border-sp-border/40 last:border-0 hover:bg-sp-mid/30 transition-colors ${
                    isSelf ? "bg-sp-green/5" : ""
                  }`}
                >
                  {/* Index */}
                  <span className="text-sp-silver text-sm">{i + 1}</span>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      u.role === "Admin"
                        ? "bg-red-500/20 text-red-400"
                        : u.role === "UserPro"
                        ? "bg-sp-green/20 text-sp-green"
                        : "bg-sp-mid text-sp-silver"
                    }`}>
                      {u.userName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-bold truncate">
                        {u.userName}
                        {isSelf && (
                          <span className="ml-2 text-xs text-sp-green font-normal">(bạn)</span>
                        )}
                      </p>
                      <p className="text-sp-silver/60 text-xs truncate">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <p className="text-sp-silver text-sm truncate">{u.email}</p>

                  {/* Role */}
                  <div><RoleBadge role={u.role} /></div>

                  {/* Song count */}
                  <p className="text-sp-silver text-sm text-right">{u.songCount}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => openEdit(u)}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors"
                      title="Sửa"
                    >
                      ✏ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={deleting === u.id || isSelf}
                      title={isSelf ? "Không thể xóa tài khoản của mình" : "Xóa"}
                      className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {deleting === u.id ? "..." : "🗑 Xóa"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary stats */}
      {!loading && users.length > 0 && (
        <div className="flex gap-4 mt-4 text-xs text-sp-silver">
          {ROLES.map((r) => {
            const count = users.filter((u) => u.role === r).length;
            return (
              <span key={r} className={`${count > 0 ? "text-white" : ""}`}>
                <span className={roleBadge[r].split(" ")[1]}>{roleLabel[r]}</span>: {count}
              </span>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <UserModal
          user={modalUser as AdminUser | null}
          onClose={() => { setModalOpen(false); setModalUser(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
