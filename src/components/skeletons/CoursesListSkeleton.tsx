/**
 * Phase 1 Perf: Skeleton loader for Courses Explorer / Top 100 lists
 */

export const CoursesListSkeleton = () => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto px-4 pb-6">
      {/* Search bar skeleton */}
      <div className="h-11 w-full bg-card rounded-lg border border-border/60 animate-pulse" />
      
      {/* Filters skeleton */}
      <div className="flex gap-2 justify-center">
        <div className="h-10 w-32 bg-card rounded-lg border border-border/60 animate-pulse" />
        <div className="h-10 w-32 bg-card rounded-lg border border-border/60 animate-pulse" />
      </div>
      
      {/* Stats row skeleton */}
      <div className="flex items-center justify-between text-sm">
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Course cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
              
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-muted animate-pulse" />
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </div>
              
              {/* Chevron */}
              <div className="w-6 h-6 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
