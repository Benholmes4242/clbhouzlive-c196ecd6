import React from 'react';
import { cn } from '@/lib/utils';
import { ClbhouzLoadingSpinner } from './ClbhouzLoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingBoundaryProps {
  /** Whether the boundary is visible */
  isVisible: boolean;
  /** Optional message to display */
  message?: string;
  /** Variant for different contexts */
  variant?: 'feed' | 'grid' | 'fullscreen';
  /** Additional className */
  className?: string;
}

export function LoadingBoundary({
  isVisible,
  message,
  variant = 'feed',
  className,
}: LoadingBoundaryProps) {
  if (!isVisible) return null;

  // Grid variant: avoid "dark screen + spinner" by showing lightweight skeleton tiles instead.
  if (variant === 'grid') {
    return (
      <div className={cn('w-full', className)}>
        <div className="grid grid-cols-2 gap-[2px]">
          <Skeleton className="aspect-[3/4]" />
          <Skeleton className="aspect-[3/4]" />
        </div>
        {message && (
          <p className="mt-3 text-center text-xs text-muted-foreground">{message}</p>
        )}
      </div>
    );
  }

  const variants = {
    feed: 'h-screen bg-black',
    fullscreen: 'h-screen bg-black',
  };

  return (
    <div
      className={cn('flex items-center justify-center', variants[variant], className)}
    >
      <ClbhouzLoadingSpinner variant="dark" size="md" message={message} />
    </div>
  );
}

export default LoadingBoundary;
