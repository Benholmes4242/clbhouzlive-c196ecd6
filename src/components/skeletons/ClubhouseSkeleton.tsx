/**
 * Phase 1 Perf: Skeleton loader for Clubhouse feed (rehydration)
 * Uses canonical clb-shimmer-dark for consistent animation.
 */

export const ClubhouseSkeleton = () => {
  return (
    <div className="w-full h-screen bg-background relative overflow-hidden">
      {/* Simulated video card skeleton */}
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-white/8 clb-shimmer-dark" />
        
        {/* Bottom HUD skeleton - matches CreatorCapsule */}
        <div
          className="absolute left-3 z-10"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 85px + 12px)' }}
        >
          <div className="glass-dark rounded-2xl px-4 py-3 min-w-[200px] max-w-[75vw] space-y-0.5">
            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/10 clb-shimmer-dark shrink-0" />
              <div className="flex-1 space-y-0.5">
                <div className="h-4 w-32 bg-white/10 rounded-lg clb-shimmer-dark" />
                <div className="h-3 w-24 bg-white/10 rounded-lg clb-shimmer-dark" />
              </div>
            </div>
            {/* Caption lines */}
            <div className="space-y-1 pt-1">
              <div className="h-3 w-full bg-white/10 rounded-lg clb-shimmer-dark" />
              <div className="h-3 w-3/4 bg-white/10 rounded-lg clb-shimmer-dark" />
            </div>
            {/* Course pill */}
            <div className="pt-1">
              <div className="h-6 w-40 rounded-full bg-white/10 clb-shimmer-dark" />
            </div>
          </div>
        </div>
        
        {/* Right rail skeleton */}
        <div className="absolute right-3 bottom-24 z-10 flex flex-col gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="glass-dark w-[50px] h-[50px] rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white/10 rounded-lg clb-shimmer-dark" />
              </div>
              <div className="h-3 w-8 bg-white/20 rounded-lg clb-shimmer-dark" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
