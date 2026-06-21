"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import SongContextMenu from "@/components/song/SongContextMenu";
import PlayerShell from "@/components/player/PlayerShell";

interface LayoutClientProps {
  children: React.ReactNode;
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Sidebar — mobile drawer */}
        <div className={`fixed inset-0 z-40 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className={`absolute inset-y-0 left-0 w-60 bg-sp-black transition-transform duration-300 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Content column */}
        <div className="flex-1 flex flex-col min-w-0 bg-sp-surface">
          <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Player bar */}
      <PlayerShell />

      {/* Bottom nav — mobile only */}
      <BottomNav />

      {/* Global right-click context menu */}
      <SongContextMenu />
    </div>
  );
}
