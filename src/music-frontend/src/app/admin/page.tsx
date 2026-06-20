"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import type { StatsDto, ApiResponse } from "@/types";

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  href?: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<StatsDto>>("/api/admin/stats")
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards: StatCard[] = stats
    ? [
        {
          label: "Người dùng",
          value: stats.totalUsers,
          icon: "👥",
          color: "from-blue-600 to-blue-800",
        },
        {
          label: "Tổng bài hát",
          value: stats.totalSongs,
          icon: "🎵",
          color: "from-purple-600 to-purple-800",
        },
        {
          label: "Đã duyệt",
          value: stats.totalApproved,
          icon: "✅",
          color: "from-green-600 to-green-800",
        },
        {
          label: "Chờ duyệt",
          value: stats.totalPending,
          icon: "⏳",
          color: "from-yellow-600 to-yellow-800",
          href: "/admin/pending",
        },
        {
          label: "Lượt nghe",
          value: stats.totalPlays.toLocaleString(),
          icon: "▶️",
          color: "from-sp-green/70 to-green-900",
        },
        {
          label: "Nghệ sĩ",
          value: stats.totalArtists,
          icon: "🎤",
          color: "from-pink-600 to-pink-800",
        },
        {
          label: "Albums",
          value: stats.totalAlbums,
          icon: "💿",
          color: "from-orange-600 to-orange-800",
        },
      ]
    : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
      <p className="text-sp-silver text-sm mb-8">
        Tổng quan hệ thống EMusic
      </p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-sp-mid rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => {
            const content = (
              <div
                className={`bg-gradient-to-br ${card.color} rounded-lg p-5 h-28 flex flex-col justify-between shadow-sp-medium hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{card.icon}</span>
                  {card.href && (
                    <span className="text-xs text-white/70 uppercase tracking-wide">
                      xem →
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white text-2xl font-bold leading-none">
                    {card.value}
                  </p>
                  <p className="text-white/70 text-xs mt-1">{card.label}</p>
                </div>
              </div>
            );

            return card.href ? (
              <Link key={card.label} href={card.href}>
                {content}
              </Link>
            ) : (
              <div key={card.label}>{content}</div>
            );
          })}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/pending"
          className="bg-sp-surface hover:bg-sp-mid rounded-lg p-5 flex items-center gap-4 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center text-2xl">
            ⏳
          </div>
          <div>
            <p className="text-white font-bold">Duyệt bài hát</p>
            <p className="text-sp-silver text-sm">
              {stats?.totalPending ?? 0} bài đang chờ duyệt
            </p>
          </div>
          <span className="ml-auto text-sp-silver group-hover:text-white transition-colors">
            →
          </span>
        </Link>

        <Link
          href="/admin/users"
          className="bg-sp-surface hover:bg-sp-mid rounded-lg p-5 flex items-center gap-4 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <p className="text-white font-bold">Quản lý người dùng</p>
            <p className="text-sp-silver text-sm">
              {stats?.totalUsers ?? 0} tài khoản
            </p>
          </div>
          <span className="ml-auto text-sp-silver group-hover:text-white transition-colors">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
