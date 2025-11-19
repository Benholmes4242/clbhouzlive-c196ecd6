/**
 * Phase 1 Perf: Skeleton loader for Clubhouse feed
 * Shows layout structure immediately while data loads
 */

export const ClubhouseSkeleton = () => {
  return (
    <div className="w-full h-screen bg-background">
      {/* Simulated video card skeleton */}
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-muted animate-pulse" />
        
        {/* Bottom HUD skeleton */}
        <div className="absolute bottom-24 left-3 z-10">
          <div className="glass-dark rounded-2xl px-4 py-3 w-[280px] space-y-2">
            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            {/* Caption lines */}
            <div className="space-y-1">
              <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
            </div>
            {/* Course pill */}
            <div className="h-6 w-40 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Right rail skeleton */}
        <div className="absolute right-3 bottom-24 z-10 flex flex-col gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="glass-dark w-[40px] h-[40px] rounded-full animate-pulse" />
              <div className="h-2 w-8 bg-white/20 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
