
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCard } from '@/components/ui/skeleton-card';

const GolfCoursesLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard 
            key={i}
            showAvatar={false}
            titleLines={1}
            contentLines={2}
            className="h-24"
          />
        ))}
      </div>
    </div>
  );
};

export default GolfCoursesLoadingSkeleton;
