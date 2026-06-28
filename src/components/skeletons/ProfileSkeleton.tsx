/**
 * Phase 1 Perf: Skeleton loader for Profile page
 * Uses canonical Skeleton component with design system tokens
 */

import { Skeleton } from '@/components/ui/skeleton';

export * from './ProfileSkeletonHelpers';

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 relative overflow-hidden">
      {/* Hero block bleeds into the notch so the transparent safe-area shield
          doesn't flash light grey before the cinematic cover loads. */}
      <div
        className="relative"
        style={{
          height: 'calc(env(safe-area-inset-top, 0px) + 250px)',
          background:
            'linear-gradient(180deg, #1E4D38 0%, #163A2B 55%, #0F172A 100%)',
        }}
      >
        <Skeleton className="absolute inset-0 rounded-none opacity-30" />
      </div>
      
      {/* Meta card overlay */}
      <div className="relative mx-4 -mt-10">
        <div className="bg-white/85 backdrop-blur-lg border border-[#e2e8f0] rounded-3xl p-4 flex items-center gap-4">
          {/* Avatar skeleton - 144px matching ProfileAvatarRing lg */}
          <div 
            className="flex-shrink-0"
            style={{ width: '144px', aspectRatio: '1 / 1.05' }}
          >
            <Skeleton className="w-full h-full rounded-[34%]" />
          </div>
          
          {/* Text meta */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Bio section skeleton */}
      <div className="mt-4 px-6 flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-3/4 max-w-sm" />
      </div>
      
      {/* Website pills skeleton */}
      <div className="mt-3 px-6 flex justify-center gap-2">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      
      {/* Stats row skeleton */}
      <div className="mt-5 flex justify-center gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="mt-6 border-b border-[#e2e8f0] bg-[#F8FAFC]">
        <div className="px-4">
          <div className="flex gap-1 py-2">
            {['Activity', 'Courses', 'Top 100', 'Stats'].map((tab) => (
              <Skeleton key={tab} className="h-10 flex-1" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Tab content skeleton */}
      <div className="px-4 py-6 space-y-4">
        {/* Post cards */}
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl border border-[#e2e8f0] p-4 space-y-3"
            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};
