"use client";

import { useRouter } from "next/navigation";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useAuthStore } from "@/store/authStore";

interface Props {
  songId: number;
  /** Called after toggle with the new isFavorite value */
  onToggle?: (isFavorite: boolean) => void;
  className?: string;
}

export default function FavoriteButton({ songId, onToggle, className = "" }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isFavorite    = useFavoritesStore((s) => s.isFavorite(songId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    const next = await toggleFavorite(songId);
    onToggle?.(next);
  };

  return (
    <button
      onClick={handleClick}
      title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      className={`transition-all duration-150 leading-none ${
        isFavorite
          ? "text-sp-green opacity-100 scale-110"
          : "text-sp-silver opacity-0 group-hover:opacity-70 hover:!text-white hover:!opacity-100"
      } ${className}`}
    >
      {isFavorite ? "♥" : "♡"}
    </button>
  );
}
