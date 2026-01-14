/**
 * EliteGameCardSkeleton - Loading skeleton for achievement cards
 * Supports large and compact variants
 */

import React from 'react';
import { cn } from '@/lib/utils';

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
          "flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white",
          className
        )}
        style={{ minHeight: '90px' }}
      >
        <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse mb-2" />
        <div className="w-12 h-3 rounded bg-slate-200 animate-pulse mb-1" />
        <div className="w-8 h-2 rounded bg-slate-200 animate-pulse" />
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
        <div className="w-32 h-3 rounded bg-slate-200 animate-pulse" />
        <div className="w-20 h-2 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
};

export default EliteGameCardSkeleton;
