"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function Topbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 bg-sp-black/80 backdrop-blur flex items-center px-4 gap-3 flex-shrink-0">
      {/* Logo — only visible on mobile (sidebar hidden) */}
      <Link href="/" className="flex items-center gap-1.5 md:hidden flex-shrink-0">
        <span className="text-sp-green text-xl">♪</span>
        <span className="text-white font-bold text-base tracking-tight">EMusic</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Auth area */}
      {user ? (
        <div className="flex items-center gap-2">
          {(user.role === "Admin" || user.role === "UserPro") && (
            <Link
              href="/upload"
              className="text-sm font-bold text-white bg-sp-mid hover:bg-sp-card px-3 py-1.5 rounded-pill transition-colors"
            >
              Upload
            </Link>
          )}
          {/* Mobile: show user initial + role */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sp-green flex items-center justify-center">
              <span className="text-sp-black font-bold text-xs uppercase">
                {user.userName[0]}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-sp-silver hover:text-white transition-colors font-bold uppercase tracking-wide"
          >
            <span className="hidden sm:inline">Đăng xuất</span>
            <span className="sm:hidden">✕</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="text-sm font-bold text-sp-silver hover:text-white uppercase tracking-wide transition-colors hidden sm:inline"
          >
            Đăng ký
          </Link>
          <Link
            href="/login"
            className="text-sm font-bold text-sp-black bg-white hover:scale-105 px-4 py-1.5 rounded-pill transition-transform uppercase tracking-wide"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </header>
  );
}
