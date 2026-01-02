/**
 * UnifiedPagination – Canonical pagination component for all list views.
 * 
 * This component should be used for ALL pagination across the app to ensure
 * consistent UI, behaviour, and scroll-to-top functionality.
 * 
 * Based on the Explore tab pagination pattern (CourseExplorer.tsx).
 */

import React, { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { COURSES_PAGE_SIZE } from '@/config/pagination';

interface UnifiedPaginationProps {
  /** Current page (0-indexed) */
  page: number;
  /** Total number of items */
  total: number;
  /** Page size (defaults to COURSES_PAGE_SIZE) */
  pageSize?: number;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Called when navigating to next page */
  onNext: () => void;
  /** Called when navigating to previous page */
  onPrev: () => void;
  /** Whether pagination controls are disabled (e.g., during loading) */
  disabled?: boolean;
  /** Label for the items being paginated (e.g., "courses", "players", "rounds") */
  itemLabel?: string;
  /** Optional ref to scroll to after pagination */
  scrollTargetRef?: RefObject<HTMLElement>;
  /** If true, uses "Page X of Y" format instead of "Showing X–Y of Z" */
  usePageFormat?: boolean;
}

export function UnifiedPagination({
  page,
  total,
  pageSize = COURSES_PAGE_SIZE,
  hasNextPage,
  onNext,
  onPrev,
  disabled = false,
  itemLabel = 'courses',
  scrollTargetRef,
  usePageFormat = false,
}: UnifiedPaginationProps) {
  const hasPrevPage = page > 0;
  const startIndex = total === 0 ? 0 : page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = page + 1;

  // Only show if there's pagination to do
  if (total <= pageSize && page === 0) {
    return null;
  }

  const handleNext = () => {
    onNext();
    if (scrollTargetRef?.current) {
      window.scrollTo({
        top: scrollTargetRef.current.offsetTop,
        left: 0,
        behavior: 'auto',
      });
    }
  };

  const handlePrev = () => {
    onPrev();
    if (scrollTargetRef?.current) {
      window.scrollTo({
        top: scrollTargetRef.current.offsetTop,
        left: 0,
        behavior: 'auto',
      });
    }
  };

  // Dynamic layout: center if only one button, space-between if both
  const layoutClass = !hasPrevPage || !hasNextPage 
    ? 'justify-center' 
    : 'justify-between';

  return (
    <div className="flex flex-col items-center gap-2 mt-4 mb-6">
      {/* Pagination Buttons */}
      {(hasPrevPage || hasNextPage) && (
        <div className={`flex items-center gap-3 w-full ${layoutClass}`}>
          {hasPrevPage && (
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={disabled}
            >
              Previous {pageSize} {itemLabel}
            </Button>
          )}
          {hasNextPage && (
            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={disabled}
            >
              Load {Math.min(pageSize, total - endIndex)} more {itemLabel}
            </Button>
          )}
        </div>
      )}
      
      {/* Status Text - 8px gap from buttons */}
      <p className="text-xs text-muted-foreground">
        {usePageFormat ? (
          <>Page {currentPage} of {totalPages}</>
        ) : (
          <>Showing {startIndex}–{endIndex} of {total.toLocaleString()} {itemLabel}</>
        )}
      </p>
    </div>
  );
}
