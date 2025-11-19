/**
 * Phase 1 Perf: Skeleton loader for Profile page
 */

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background page-with-header">
      {/* Hero header skeleton */}
      <div className="relative h-48 bg-muted animate-pulse">
        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-xl bg-card border-4 border-background animate-pulse" />
        </div>
      </div>
      
      {/* Profile info */}
      <div className="px-6 pt-16 pb-4 space-y-3">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Stats row */}
      <div className="px-6 pb-4 flex gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-6 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6 px-6">
          {['Activity', 'Courses', 'Stats'].map((tab) => (
            <div key={tab} className="h-10 w-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* Grid skeleton */}
      <div className="p-4 grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
};
