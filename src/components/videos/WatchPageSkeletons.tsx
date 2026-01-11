import React from 'react';
import { cn } from '@/lib/utils';

interface WatchPageSkeletonsProps {
  className?: string;
}

/**
 * WatchPageSkeletons - Loading skeleton states for Watch page sections
 */
export const WatchPageSkeletons: React.FC<WatchPageSkeletonsProps> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Hero Skeleton */}
      <HeroSkeleton />
      
      {/* Continue Watching Skeleton */}
      <HorizontalCarouselSkeleton title="Continue watching" count={3} />
      
      {/* Trending Now Skeleton */}
      <HorizontalCarouselSkeleton title="Trending Now" count={4} />
      
      {/* Creators Skeleton */}
      <CreatorsSkeleton />
      
      {/* Grid Skeleton */}
      <GridSkeleton />
    </div>
  );
};

/**
 * Hero skeleton with shimmer effect
 */
export const HeroSkeleton: React.FC = () => (
  <div className="px-4 mb-6">
    <div className="relative rounded-2xl overflow-hidden bg-muted animate-pulse">
      <div className="aspect-video" />
      {/* Badge placeholder */}
      <div className="absolute top-4 left-4 h-7 w-24 bg-muted-foreground/20 rounded-full" />
      {/* Content overlay placeholder */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
        <div className="h-5 bg-muted-foreground/20 rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted-foreground/20" />
          <div className="h-4 bg-muted-foreground/20 rounded w-24" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 bg-muted-foreground/20 rounded w-16" />
          <div className="h-4 bg-muted-foreground/20 rounded w-24" />
        </div>
      </div>
    </div>
  </div>
);

interface HorizontalCarouselSkeletonProps {
  title?: string;
  count?: number;
}

/**
 * Horizontal carousel skeleton for Continue Watching / Trending
 */
export const HorizontalCarouselSkeleton: React.FC<HorizontalCarouselSkeletonProps> = ({ 
  title,
  count = 4 
}) => (
  <section className="mb-6">
    {/* Header */}
    <div className="flex items-center justify-between px-4 mb-3">
      {title ? (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-muted rounded animate-pulse" />
          <div className="h-5 bg-muted rounded animate-pulse" style={{ width: `${title.length * 8}px` }} />
        </div>
      ) : (
        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
      )}
      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
    </div>
    
    {/* Cards */}
    <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-36">
          <div className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
          <div className="space-y-1.5 mt-2">
            <div className="h-4 bg-muted rounded w-full animate-pulse" />
            <div className="h-3 bg-muted/60 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </section>
);

/**
 * Compact creators skeleton
 */
export const CreatorsSkeleton: React.FC = () => (
  <section className="mb-6">
    {/* Header */}
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
    </div>
    
    {/* Creator cards */}
    <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
          <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-14 bg-muted rounded animate-pulse" />
          <div className="h-7 w-16 bg-muted rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  </section>
);

/**
 * Video grid skeleton
 */
export const GridSkeleton: React.FC = () => (
  <div className="divide-y divide-border/30">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-card overflow-hidden">
        {/* Thumbnail */}
        <div className="aspect-video bg-muted animate-pulse" />
        {/* Meta */}
        <div className="px-4 py-3 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted/60 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Continue Watching tile skeleton with progress bar
 */
export const ContinueWatchingTileSkeleton: React.FC = () => (
  <div className="bg-card overflow-hidden">
    <div className="relative">
      <div className="aspect-video bg-muted animate-pulse" />
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/20">
        <div className="h-full w-1/3 bg-primary/40 animate-pulse" />
      </div>
    </div>
    <div className="px-4 py-3 flex gap-3">
      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-muted/60 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  </div>
);

export default WatchPageSkeletons;
