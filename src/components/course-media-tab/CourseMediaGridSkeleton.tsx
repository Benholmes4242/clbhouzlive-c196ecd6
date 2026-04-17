import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const CourseMediaGridSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {/* Header skeleton */}
    <div style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Skeleton className="h-8 w-16" style={{ borderRadius: 8 }} />
        <Skeleton className="h-8 w-20" style={{ borderRadius: 8 }} />
        <Skeleton className="h-8 w-20" style={{ borderRadius: 8 }} />
      </div>
    </div>

    {/* Hero skeleton */}
    <Skeleton className="w-full" style={{ height: 240, borderRadius: 0 }} />

    {/* Grid skeleton — 2-col portraits, gap 2 */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={`tile-${i}`} className="w-full" style={{ aspectRatio: '3/4', borderRadius: 0 }} />
      ))}
      {/* Landscape band */}
      <Skeleton className="w-full" style={{ gridColumn: '1 / -1', aspectRatio: '16/9', borderRadius: 0 }} />
      {/* Two more portraits */}
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={`tile-b-${i}`} className="w-full" style={{ aspectRatio: '3/4', borderRadius: 0 }} />
      ))}
    </div>
  </div>
);
