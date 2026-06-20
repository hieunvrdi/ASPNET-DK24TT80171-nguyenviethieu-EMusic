"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const adminNav = [
  { href: "/admin",           label: "Tổng quan",       icon: "📊" },
  { href: "/admin/pending",   label: "Bài chờ duyệt",   icon: "⏳" },
  { href: "/admin/songs",     label: "Quản lý bài hát", icon: "🎵" },
  { href: "/admin/artists",   label: "Quản lý ca sĩ",   icon: "🎤" },
  { href: "/admin/albums",    label: "Quản lý album",   icon: "💿" },
  { href: "/admin/genres",    label: "Thể loại",         icon: "🎼" },
  { href: "/admin/users",     label: "Người dùng",       icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  useEffect(() => {
    // Wait a tick for AuthInitializer to hydrate store from localStorage
    const timer = setTimeout(() => {
      if (user && user.role !== "Admin") {
        router.replace("/");
      }
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || user.role !== "Admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sp-silver text-sm">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Admin sidebar */}
      <aside className="w-52 bg-sp-black border-r border-sp-border flex-shrink-0 p-4">
        <p className="text-xs text-sp-silver uppercase tracking-widest mb-4 px-2">
          Admin Panel
        </p>
        <nav className="space-y-1">
          {adminNav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  active
                    ? "bg-sp-mid text-white font-bold"
                    : "text-sp-silver hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Admin content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
