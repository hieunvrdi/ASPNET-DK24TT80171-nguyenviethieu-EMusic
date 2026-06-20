"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { href: "/",         label: "Trang chủ",  icon: "🏠" },
  { href: "/songs",    label: "Khám phá",   icon: "🎵" },
  { href: "/artists",  label: "Nghệ sĩ",    icon: "🎤" },
  { href: "/playlists", label: "Playlist",  icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthStore();

  return (
    <aside className="hidden md:flex w-60 bg-sp-black flex-col flex-shrink-0 h-full overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sp-green text-2xl">♪</span>
          <span className="text-white font-bold text-xl tracking-tight">EMusic</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    active ? "text-white font-bold" : "text-sp-silver hover:text-white font-normal"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {user && (
          <>
            <div className="h-px bg-sp-border my-4" />
            <ul className="space-y-1">
              <li>
                <Link
                  href="/favorites"
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    pathname === "/favorites" ? "text-white font-bold" : "text-sp-silver hover:text-white"
                  }`}
                >
                  <span>❤️</span> Yêu thích
                </Link>
              </li>
              <li>
                <Link
                  href="/my-uploads"
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    pathname === "/my-uploads" ? "text-white font-bold" : "text-sp-silver hover:text-white"
                  }`}
                >
                  <span>📤</span> Bài đã upload
                </Link>
              </li>
              {isAdmin() && (
                <li>
                  <Link
                    href="/admin"
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                      pathname.startsWith("/admin") ? "text-sp-green font-bold" : "text-sp-silver hover:text-white"
                    }`}
                  >
                    <span>⚙️</span> Admin
                  </Link>
                </li>
              )}
            </ul>
          </>
        )}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-t border-sp-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sp-green flex items-center justify-center">
              <span className="text-sp-black font-bold text-sm uppercase">
                {user.userName[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">{user.userName}</p>
              <p className="text-sp-silver text-xs">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
