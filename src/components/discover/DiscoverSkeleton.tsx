import React from 'react';

const DiscoverSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground page-with-header">
      <main className="pb-20">
        {/* Static Tabs and Search Skeleton */}
        <div className="relative z-30 bg-white">
          {/* Segmented Control Skeleton */}
          <div className="flex gap-2 p-3 border-b border-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          
          {/* Search Bar Skeleton */}
          <div className="px-1 pt-2 pb-1 bg-white">
            <div className="mx-1">
              <div className="h-10 w-full bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
          
          {/* Filter Pills Skeleton */}
          <div className="pt-1 pb-3 border-b border-gray-50 pl-1.5">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="md:container md:mx-auto md:px-0 mt-4 px-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DiscoverSkeleton;
