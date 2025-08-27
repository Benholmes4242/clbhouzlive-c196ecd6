import React from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';

export const ProfileHeaderSkeleton = () => {
  return <ClubhouzLoading />;
};

export const ProfileTabsSkeleton = () => {
  return (
    <div className="bg-background min-h-screen">
      {/* Tabs Skeleton */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 md:px-0">
          <div className="flex gap-8 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 md:px-0 py-8">
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