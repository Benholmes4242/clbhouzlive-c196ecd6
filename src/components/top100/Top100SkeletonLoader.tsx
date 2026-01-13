/**
 * Top100SkeletonLoader - Premium skeleton loading states for Top 100 Hub
 * Provides shimmer animations for summary stats, toggle, and regional cards
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Skeleton shimmer base component
const SkeletonShimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('clb-skeleton rounded-sq-md', className)} />
);

// Summary stats skeleton
export const Top100SummarySkeleton: React.FC = () => (
  <section className="my-4 flex flex-col items-center text-center gap-2 px-4 animate-fade-in">
    {/* Headline shimmer */}
    <SkeletonShimmer className="h-5 w-72 rounded-full" />
    
    {/* Secondary line shimmer */}
    <SkeletonShimmer className="h-4 w-48 rounded-full" />
    
    {/* Progress bar shimmer */}
    <div className="w-full max-w-[400px] mt-1">
      <SkeletonShimmer className="h-2 w-full rounded-full" />
    </div>
  </section>
);

// View toggle skeleton
export const Top100ToggleSkeleton: React.FC = () => (
  <div className="flex justify-center py-3 animate-fade-in">
    <SkeletonShimmer className="h-9 w-36 rounded-full" />
  </div>
);

// Single regional card skeleton
export const Top100CardSkeleton: React.FC = () => (
  <div className="relative overflow-hidden rounded-sq-lg h-[300px] sm:h-[320px] animate-fade-in">
    {/* Background shimmer */}
    <SkeletonShimmer className="absolute inset-0 rounded-sq-lg" />
    
    {/* Content overlay simulation */}
    <div className="absolute inset-0 flex flex-col justify-between p-4">
      {/* Title area */}
      <div className="flex justify-between items-start">
        <SkeletonShimmer className="h-6 w-40 rounded-full bg-white/10" />
        <SkeletonShimmer className="h-6 w-12 rounded-full bg-white/10" />
      </div>
      
      {/* Bottom content */}
      <div className="space-y-3">
        <SkeletonShimmer className="h-4 w-36 rounded-full bg-white/10" />
        <div className="flex items-center gap-2.5">
          <SkeletonShimmer className="h-[5px] flex-1 rounded-full bg-white/15" />
          <SkeletonShimmer className="h-4 w-8 rounded-full bg-white/10" />
        </div>
        <SkeletonShimmer className="h-3 w-28 rounded-full bg-white/10" />
        <div className="flex justify-end">
          <SkeletonShimmer className="h-8 w-28 rounded-sq-sm bg-white/15" />
        </div>
      </div>
    </div>
  </div>
);

// Grid of card skeletons
export const Top100CardsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <Top100CardSkeleton key={i} />
    ))}
  </div>
);

// Full loading state for Courses tab
export const Top100CoursesTabSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Top100SummarySkeleton />
    <Top100ToggleSkeleton />
    <Top100CardsGridSkeleton count={4} />
  </div>
);

// Empty state component for 0 courses rated
interface Top100EmptyStateProps {
  onExplore?: () => void;
}

export const Top100EmptyState: React.FC<Top100EmptyStateProps> = ({ onExplore }) => (
  <section className="my-6 flex flex-col items-center text-center gap-4 px-4 py-8">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
      <span className="text-3xl">⛳</span>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Start your Top 100 journey
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Explore and rate the world's greatest golf courses. Your progress will appear here.
      </p>
    </div>
    {onExplore && (
      <button
        onClick={onExplore}
        className={cn(
          'inline-flex items-center gap-2 px-5 py-2.5 rounded-full',
          'bg-slate-900 dark:bg-white text-white dark:text-slate-900',
          'text-sm font-medium',
          'hover:bg-slate-800 dark:hover:bg-slate-100',
          'active:scale-[0.98] transition-all duration-150'
        )}
      >
        Explore courses
      </button>
    )}
  </section>
);

export default Top100CoursesTabSkeleton;
