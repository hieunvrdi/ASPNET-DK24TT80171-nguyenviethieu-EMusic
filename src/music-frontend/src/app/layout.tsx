import type { Metadata } from "next";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import BottomNav from "@/components/layout/BottomNav";
import SongContextMenu from "@/components/song/SongContextMenu";
import PlayerShell from "@/components/player/PlayerShell";

export const metadata: Metadata = {
  title: "EMusic — Nghe nhạc trực tuyến",
  description: "Website nghe nhạc trực tuyến EMusic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-sp-black text-white antialiased">
        <AuthInitializer />

        <div className="flex flex-col h-screen">
          {/* Main area */}
          <div className="flex flex-1 min-h-0">
            {/* Sidebar — hidden on mobile */}
            <Sidebar />

            {/* Content column */}
            <div className="flex-1 flex flex-col min-w-0 bg-sp-surface">
              <Topbar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>

          {/* Player bar */}
          <PlayerShell />

          {/* Bottom nav — mobile only */}
          <BottomNav />
        </div>

        {/* Global right-click context menu */}
        <SongContextMenu />
      </body>
    </html>
  );
}
