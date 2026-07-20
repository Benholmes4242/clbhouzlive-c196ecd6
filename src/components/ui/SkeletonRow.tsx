import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonRowProps {
  count?: number;
  className?: string;
}

export function SkeletonRow({ count = 6, className = '' }: SkeletonRowProps) {
  return (
    <div className={`grid grid-flow-col auto-cols-[220px] gap-3 overflow-x-auto no-scrollbar ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-sq-md" />
      ))}
    </div>
  );
}

export default SkeletonRow;
