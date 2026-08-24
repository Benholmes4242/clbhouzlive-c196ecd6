/**
 * EliteGameCardSkeleton - Loading skeleton for achievement cards
 * Supports large and compact variants
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EliteGameCardSkeletonProps {
  variant: 'large' | 'compact';
  className?: string;
}

export const EliteGameCardSkeleton: React.FC<EliteGameCardSkeletonProps> = ({ 
  variant,
  className,
}) => {
  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center p-3 rounded-xl border border-border/10 bg-card",
          className
        )}
        style={{ minHeight: '90px' }}
      >
        <Skeleton className="w-9 h-9 rounded-full mb-2" />
        <Skeleton className="w-12 h-3 mb-1" />
        <Skeleton className="w-8 h-2" />
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border border-border/10 bg-card",
        className
      )}
    >
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-32 h-3" />
        <Skeleton className="w-20 h-2" />
      </div>
    </div>
  );
};

export default EliteGameCardSkeleton;
