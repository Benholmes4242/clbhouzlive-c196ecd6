import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const VideoCardSkeleton: React.FC = () => (
  <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
    {/* Creator header */}
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    {/* Caption */}
    <div className="px-4 pb-2 space-y-1.5">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
    {/* Video area 16:9 */}
    <Skeleton className="w-full aspect-video" />
    {/* Engagement row */}
    <div className="flex gap-4 px-4 py-3">
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-3 w-10" />
    </div>
  </div>
);

export default VideoCardSkeleton;
