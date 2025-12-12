/**
 * ExploreLoadMoreButton - Load more CTA for Explore tab pagination
 * 
 * Shows "Next 10 courses" button, loading state, and end state.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ExploreLoadMoreButtonProps {
  /** Whether there are more courses to load */
  hasMore: boolean;
  /** Whether we're currently loading more */
  isLoading: boolean;
  /** Callback to load more courses */
  onLoadMore: () => void;
  /** Total courses loaded so far */
  loadedCount: number;
  /** Total courses available */
  totalCount: number;
  /** Page size for display */
  pageSize?: number;
}

export function ExploreLoadMoreButton({
  hasMore,
  isLoading,
  onLoadMore,
  loadedCount,
  totalCount,
  pageSize = 10,
}: ExploreLoadMoreButtonProps) {
  // Hide entirely if less than pageSize results total
  if (totalCount <= pageSize && loadedCount >= totalCount) {
    return null;
  }

  // End state - no more results
  if (!hasMore && loadedCount >= totalCount) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <p className="text-sm text-muted-foreground">You've reached the end</p>
        <p className="text-xs text-muted-foreground/70">
          Showing all {totalCount.toLocaleString()} courses
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Button
        variant="secondary"
        size="lg"
        onClick={onLoadMore}
        disabled={isLoading}
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          `Next ${pageSize} courses`
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Showing {loadedCount} of {totalCount.toLocaleString()} courses
      </p>
    </div>
  );
}
