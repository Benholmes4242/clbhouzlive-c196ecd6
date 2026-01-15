interface CreatorContentSkeletonProps {
  filter: 'all' | 'longform' | 'shorts' | 'images';
}

export function CreatorContentSkeleton({ filter }: CreatorContentSkeletonProps) {
  if (filter === 'shorts') {
    // 3-column portrait grid skeleton
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[9/16] bg-slate-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (filter === 'images') {
    // 3-column square grid skeleton
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-slate-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  // Card skeleton for all/longform
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="aspect-video bg-slate-100 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
