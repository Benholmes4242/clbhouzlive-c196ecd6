import React from 'react';

export const ProfileHeaderSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden" 
         style={{ 
           marginTop: '-8rem',
           height: '65vh',
           minHeight: '600px',
           maxHeight: '800px',
           paddingTop: '8rem'
         }}>
      
      {/* Background Skeleton */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
      
      {/* Central Media Skeleton */}
      <div className="relative z-10 w-full h-full flex items-start justify-center pt-20">
        <div 
          className="clbhouz-squircle overflow-hidden bg-gray-300 dark:bg-gray-600 animate-pulse"
          style={{
            width: '400px',
            height: '400px',
          }}
        />
      </div>

      {/* Profile Info Skeleton */}
      <div className="absolute bottom-[-16rem] left-0 right-0 z-50 flex flex-col items-center text-center pb-8 px-4 pt-16">
        {/* User Name Skeleton */}
        <div className="text-center mb-6">
          <div className="h-12 md:h-16 w-64 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse mb-3" />
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2" />
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
        </div>

        {/* Stats Skeleton */}
        <div className="flex items-center justify-center gap-4 w-full">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
          <div className="flex-shrink-0 overflow-hidden rounded-lg w-full md:w-[520px]">
            <div className="flex gap-6 md:gap-16 px-2 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 text-center w-20">
                  <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse mb-2 mx-auto" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const ProfileTabsSkeleton = () => {
  return (
    <div className="bg-background min-h-screen">
      {/* Tabs Skeleton */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 border">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-2" />
              <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ActivityFeedSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-4" />
          <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-black/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-4 min-h-[100px] flex flex-col justify-center">
          <div className="h-4 w-16 bg-white/30 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-white/30 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
};