/**
 * FixedPaginationDock – Fixed pagination footer for Discover pages.
 * 
 * Pins the pagination block (button + "Showing X–Y of Z") 24px above
 * the bottom nav across all Discover pages: Explore, Top 100, Friends Courses, My Progress.
 */

import React, { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { COURSES_PAGE_SIZE } from '@/config/pagination';

interface FixedPaginationDockProps {
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
  onPrev?: () => void;
  /** Whether pagination controls are disabled (e.g., during loading) */
  disabled?: boolean;
  /** Loading state for next button */
  isLoadingMore?: boolean;
  /** Label for the items being paginated (e.g., "courses", "players", "rounds") */
  itemLabel?: string;
  /** Optional ref to scroll to after pagination */
  scrollTargetRef?: RefObject<HTMLElement>;
  /** Custom label for next button (e.g., "Next 10 courses") */
  nextButtonLabel?: string;
  /** If true, uses load-more style (single button) instead of prev/next */
  loadMoreStyle?: boolean;
  /** Start index for "Showing X–Y" display (defaults to calculated from page) */
  startIndex?: number;
  /** End index for "Showing X–Y" display (defaults to calculated from page) */
  endIndex?: number;
}

export function FixedPaginationDock({
  page,
  total,
  pageSize = COURSES_PAGE_SIZE,
  hasNextPage,
  onNext,
  onPrev,
  disabled = false,
  isLoadingMore = false,
  itemLabel = 'courses',
  scrollTargetRef,
  nextButtonLabel,
  loadMoreStyle = false,
  startIndex: customStartIndex,
  endIndex: customEndIndex,
}: FixedPaginationDockProps) {
  const hasPrevPage = page > 0 && !loadMoreStyle;
  const startIndex = customStartIndex ?? (total === 0 ? 0 : page * pageSize + 1);
  const endIndex = customEndIndex ?? Math.min((page + 1) * pageSize, total);

  // Don't render if no pagination needed
  if (total === 0) return null;

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
    onPrev?.();
    if (scrollTargetRef?.current) {
      window.scrollTo({
        top: scrollTargetRef.current.offsetTop,
        left: 0,
        behavior: 'auto',
      });
    }
  };

  const defaultNextLabel = `Next ${Math.min(pageSize, total - endIndex)} ${itemLabel}`;

  return (
    <>
      {/* Spacer to prevent content from going under the fixed dock */}
      <div className="h-24" aria-hidden="true" />
      
      {/* Fixed dock */}
      <div 
        className="fixed left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/40 px-4 py-3"
        style={{ bottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
          {/* Buttons row */}
          {(hasNextPage || hasPrevPage) && (
            <div className={`flex items-center gap-3 w-full ${hasPrevPage && hasNextPage ? 'justify-between' : 'justify-center'}`}>
              {hasPrevPage && onPrev && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={disabled}
                  className="gap-1.5"
                >
                  <ChevronUp className="h-4 w-4" />
                  Previous {pageSize} {itemLabel}
                </Button>
              )}
              {hasNextPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={disabled || isLoadingMore}
                  className="gap-1.5 transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {nextButtonLabel || defaultNextLabel}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          
          {/* Status text */}
          <p className="text-[11px] text-muted-foreground">
            Showing {startIndex}–{endIndex} of {total.toLocaleString()} {itemLabel}
          </p>
        </div>
      </div>
    </>
  );
}
