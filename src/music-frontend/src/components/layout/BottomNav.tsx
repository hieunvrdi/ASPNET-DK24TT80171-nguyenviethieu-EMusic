"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const baseNav = [
  { href: "/",         label: "Trang chủ", icon: "🏠" },
  { href: "/songs",    label: "Khám phá",  icon: "🎵" },
  { href: "/artists",  label: "Nghệ sĩ",   icon: "🎤" },
  { href: "/playlists", label: "Playlist", icon: "📋" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const items = [
    ...baseNav,
    ...(user ? [{ href: "/favorites", label: "Yêu thích", icon: "❤️" }] : []),
  ];

  return (
    <nav className="md:hidden flex-shrink-0 bg-sp-black border-t border-sp-border">
      <ul className="flex items-center justify-around h-[58px]">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${
                  active ? "text-sp-green" : "text-sp-silver"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
