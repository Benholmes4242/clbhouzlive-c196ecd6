import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

/**
 * Standardized shimmer loading component
 * Consistent gradient, radius, and animation speed across the app
 */
export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/50 rounded-sq-sm',
        'before:absolute before:inset-0',
        'before:translate-x-[-100%]',
        'before:animate-[shimmer_1.5s_infinite]',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
    />
  );
}

/**
 * Shimmer placeholder for avatar
 */
export function ShimmerAvatar({ className }: ShimmerProps) {
  return <Shimmer className={cn('w-10 h-10 rounded-full', className)} />;
}

/**
 * Shimmer placeholder for text line
 */
export function ShimmerText({ className }: ShimmerProps) {
  return <Shimmer className={cn('h-4 rounded-sq-xs', className)} />;
}

/**
 * Shimmer placeholder for card
 */
export function ShimmerCard({ className }: ShimmerProps) {
  return <Shimmer className={cn('w-full h-32 rounded-sq-md', className)} />;
}

/**
 * Comment skeleton for comments loading state
 */
export function CommentSkeleton() {
  return (
    <div className="flex gap-3 py-3 px-4">
      <ShimmerAvatar className="flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <ShimmerText className="w-24" />
        <ShimmerText className="w-full" />
        <ShimmerText className="w-3/4" />
      </div>
    </div>
  );
}

/**
 * Search result skeleton
 */
export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <ShimmerAvatar />
      <div className="flex-1 space-y-2">
        <ShimmerText className="w-32" />
        <ShimmerText className="w-24" />
      </div>
    </div>
  );
}

/**
 * Feed item skeleton for Clubhouse
 */
export function FeedItemSkeleton() {
  return (
    <div className="w-full aspect-[9/16] relative">
      <Shimmer className="absolute inset-0 rounded-none" />
      <div className="absolute bottom-4 left-4 right-16 space-y-2">
        <ShimmerText className="w-24" />
        <ShimmerText className="w-48" />
        <ShimmerText className="w-32" />
      </div>
    </div>
  );
}
