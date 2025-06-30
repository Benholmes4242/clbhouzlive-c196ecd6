
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const GolfCoursesLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" style={{ backgroundColor: '#b66b41', opacity: 0.3 }} />
        <Skeleton className="h-10 w-32" style={{ backgroundColor: '#b66b41', opacity: 0.3 }} />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" style={{ backgroundColor: '#b66b41', opacity: 0.3 }} />
        ))}
      </div>
    </div>
  );
};

export default GolfCoursesLoadingSkeleton;
