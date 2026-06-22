export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-sp-mid rounded animate-pulse ${className}`}
    />
  );
}

export function SongSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      <Skeleton className="w-14 h-14 rounded flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-12 h-4" />
    </div>
  );
}

export function SongCardSkeleton() {
  return (
    <div className="group cursor-pointer">
      <Skeleton className="w-full aspect-square rounded-lg mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function ArtistHeroSkeleton() {
  return (
    <div className="relative h-52 bg-gradient-to-b from-sp-card to-sp-surface flex items-end px-6 pb-6">
      <div className="flex items-end gap-5">
        <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}
