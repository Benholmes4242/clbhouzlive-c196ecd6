import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonAvatar } from '@/components/ui/skeleton-avatar';
import './nearby.css';

interface NearbySkeletonRowProps {
  count?: number;
}

export function NearbySkeletonRow({ count = 3 }: NearbySkeletonRowProps) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mx-3 rounded-[18px] backdrop-blur-[20px] border border-white/8 bg-white/[0.05] overflow-hidden"
          style={{
            padding: '16px 14px',
            animation: `rowFadeUp 90ms ease-out both ${i * 35}ms`
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <SkeletonAvatar size="lg" className="bg-white/[0.07]" style={{ borderRadius: '28%' }} />

            {/* Content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-[17px] w-[120px] bg-white/[0.07]" />
              <Skeleton className="h-[14px] w-[180px] bg-white/[0.07]" />
            </div>
          </div>

          {/* Button row skeleton */}
          <div className="flex gap-2 mt-3">
            {[0, 1, 2].map((btnIdx) => (
              <Skeleton key={btnIdx} className="flex-1 h-9 rounded-xl bg-white/[0.07]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
