"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const roleLabel: Record<string, string> = {
    User: "Người dùng",
    UserPro: "Người dùng Pro",
    Admin: "Quản trị viên",
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Hồ sơ của tôi</h1>
        <p className="text-sp-silver">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Profile card */}
      <div className="bg-sp-surface rounded-lg p-8">
        {/* Avatar placeholder + info */}
        <div className="flex items-start gap-6 pb-8 border-b border-sp-border">
          <div className="w-24 h-24 rounded-full bg-sp-green flex items-center justify-center flex-shrink-0 text-5xl shadow-sp-heavy">
            👤
          </div>

          <div className="flex-1">
            <p className="text-xs text-sp-silver uppercase tracking-widest mb-2">
              Tài khoản
            </p>
            <p className="text-2xl font-bold text-white mb-1">{user.userName}</p>
            <p className="text-sm text-sp-silver">{user.email}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8">
          {/* Role */}
          <div>
            <p className="text-xs text-sp-silver uppercase tracking-widest mb-2">
              Loại tài khoản
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === "Admin"
                    ? "bg-sp-orange/20 text-sp-orange"
                    : user.role === "UserPro"
                      ? "bg-sp-green/20 text-sp-green"
                      : "bg-sp-blue/20 text-sp-blue"
                }`}
              >
                {roleLabel[user.role]}
              </span>
            </div>
          </div>

          {/* Join date */}
          <div>
            <p className="text-xs text-sp-silver uppercase tracking-widest mb-2">
              Ngày tham gia
            </p>
            <p className="text-sm text-white">{joinDate}</p>
          </div>

          {/* User ID */}
          <div>
            <p className="text-xs text-sp-silver uppercase tracking-widest mb-2">
              ID người dùng
            </p>
            <p className="text-sm text-sp-silver font-mono">#{user.id}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs text-sp-silver uppercase tracking-widest mb-2">
              Email
            </p>
            <p className="text-sm text-white truncate">{user.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-8 border-t border-sp-border space-y-3">
          <button
            onClick={logout}
            className="w-full px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
          >
            🚪 Đăng xuất
          </button>

          <p className="text-xs text-sp-silver text-center pt-2">
            Bạn sẽ được quay lại trang chủ
          </p>
        </div>
      </div>

      {/* Additional info */}
      <div className="mt-8 p-6 bg-sp-mid rounded-lg">
        <p className="text-sm text-sp-silver">
          <span className="font-bold text-white">💡 Mẹo:</span> Để bảo mật tài
          khoản, vui lòng đăng xuất khi sử dụng trên các máy tính công cộng.
        </p>
      </div>
    </div>
  );
}
