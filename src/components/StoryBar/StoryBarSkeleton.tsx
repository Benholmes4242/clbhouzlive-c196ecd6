
import React from 'react';

const StoryBarSkeleton = () => {
  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 md:px-0 py-2">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Loading skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-1 min-w-0">
              <div className="w-20 h-20 bg-muted rounded-full animate-pulse" />
              <div className="w-16 h-3 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryBarSkeleton;
