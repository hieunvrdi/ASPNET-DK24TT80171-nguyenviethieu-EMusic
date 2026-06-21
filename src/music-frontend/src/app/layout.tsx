import type { Metadata } from "next";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";
import LayoutClient from "@/components/layout/LayoutClient";

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
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
