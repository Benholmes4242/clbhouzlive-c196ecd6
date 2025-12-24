/**
 * VerticalFeedLayout - Snap-scroll vertical feed layout
 * 
 * Used for Clubhouse-style full-screen vertical feeds
 * Each item takes full viewport height with snap scrolling
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface VerticalFeedLayoutProps {
  children: React.ReactNode;
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export const VerticalFeedLayout = forwardRef<HTMLDivElement, VerticalFeedLayoutProps>(
  ({ children, className, onScroll, onTouchStart, onTouchMove, onTouchEnd }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'h-full w-full overflow-y-auto overflow-x-hidden',
          'snap-y snap-mandatory scroll-smooth',
          'scrollbar-none', // Hide scrollbar
          className
        )}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
        }}
      >
        {children}
      </div>
    );
  }
);

VerticalFeedLayout.displayName = 'VerticalFeedLayout';

/**
 * VerticalFeedItem - Individual item in vertical feed
 * Takes full viewport height with snap alignment
 */
interface VerticalFeedItemProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}

export function VerticalFeedItem({ 
  children, 
  className,
  isActive = false,
}: VerticalFeedItemProps) {
  return (
    <div
      className={cn(
        'h-[100dvh] w-full relative',
        'snap-start snap-always',
        'flex-shrink-0',
        className
      )}
      data-active={isActive}
    >
      {children}
    </div>
  );
}
