import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/** Edge-to-edge row skeletons matching the Inbox row anatomy. */
export const ActivitySkeleton: React.FC = () => {
  return (
    <div className="w-full">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-start"
          style={{
            gap: 12,
            padding: '13px 16px',
            borderTop: i > 0 ? '1px solid rgba(15,23,42,0.06)' : undefined,
            borderLeft: '2.5px solid transparent',
          }}
        >
          <Skeleton style={{ width: 44, height: 44, borderRadius: '34%', flexShrink: 0 }} />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3.5" style={{ width: `${60 + ((i * 7) % 30)}%` }} />
            <Skeleton className="h-3" style={{ width: `${40 + ((i * 5) % 25)}%` }} />
          </div>
          <Skeleton className="h-3 w-8 shrink-0" />
        </div>
      ))}
    </div>
  );
};
