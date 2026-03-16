import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const WatchGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-[2px] px-[2px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/5] rounded-[4px]" />
      ))}
    </div>
  );
};

export default WatchGridSkeleton;
