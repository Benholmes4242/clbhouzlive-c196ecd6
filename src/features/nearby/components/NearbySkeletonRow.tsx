import React from 'react';
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
          className="mx-3 rounded-[18px] backdrop-blur-[20px] border overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255,255,255,0.08)',
            padding: '16px 14px',
            animation: `rowFadeUp 90ms ease-out both ${i * 35}ms`
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <div className="skel shrink-0 w-[52px] h-[52px]" style={{ borderRadius: '28%' }} />

            {/* Content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="skel h-[17px] w-[120px]" />
              <div className="skel h-[14px] w-[180px]" />
            </div>
          </div>

          {/* Button row skeleton */}
          <div className="flex gap-2 mt-3">
            {[0, 1, 2].map((btnIdx) => (
              <div key={btnIdx} className="skel flex-1 h-9 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
