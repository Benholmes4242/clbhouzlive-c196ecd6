/**
 * WatchTabSkeleton - Full page loading skeleton for Watch tab
 * 
 * Matches the actual Watch tab layout:
 * - Search bar area
 * - 3-column shorts grid with dark media placeholders
 */

export function WatchTabSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">
      {/* Search bar placeholder */}
      <div className="px-4 pt-3 pb-2">
        <div 
          className="h-9 rounded-sq-sm relative overflow-hidden"
          style={{ backgroundColor: 'hsl(220, 10%, 92%)' }}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>

      {/* Grid Skeleton - dark media placeholders matching actual card aspect ratio */}
      <div className="pt-1 pb-4">
        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i} 
              className="aspect-[4/5] relative overflow-hidden"
              style={{ backgroundColor: 'hsl(220, 10%, 18%)' }}
            >
              <div 
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WatchTabSkeleton;
