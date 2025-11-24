/**
 * Phase 2 Perf: Skeleton loader for Course Detail page with minimum display time
 * Shows hero + tab structure immediately, prevents flash on fast loads
 */

import { useState, useEffect } from 'react';

const MIN_DISPLAY_TIME = 150; // ms - prevents skeleton flash on fast loads

export const CourseDetailSkeleton = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Show skeleton after a brief moment to prevent flash on instant loads
    const timer = setTimeout(() => setShouldShow(true), MIN_DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldShow) {
    // Return invisible placeholder to maintain layout
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-muted/60 pb-20 animate-in fade-in duration-200">
      {/* Hero skeleton */}
      <div className="relative h-[400px] bg-muted animate-pulse">
        {/* Title area */}
        <div className="absolute bottom-14 left-6 space-y-3">
          <div className="h-10 w-64 bg-white/20 rounded animate-pulse" />
          <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex gap-4 px-6 py-3">
          {['About', 'Reviews', 'Media'].map((label) => (
            <div key={label} className="h-6 w-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        {/* Community Score card */}
        <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-3">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 flex-1 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
        
        {/* About card */}
        <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-2">
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          </div>
        </div>
        
        {/* Location card */}
        <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-3">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-32 w-full bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};
