"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start loading
    setProgress(20);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Complete loading
    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 left-0 h-1 bg-sp-green transition-all duration-500 ease-out ${
        progress === 0 ? "opacity-0" : "opacity-100"
      }`}
      style={{ width: `${progress}%` }}
    />
  );
}
