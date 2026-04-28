import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingsSkeletonProps {
  /** Number of sections to show */
  sections?: Array<{ title: string; rows: number }>;
}

export function SettingsSkeleton({
  sections = [
    { title: 'Account', rows: 2 },
    { title: 'Identity & Creator', rows: 2 },
    { title: 'Privacy & Safety', rows: 5 },
    { title: 'Notifications & Watch', rows: 2 },
    { title: 'Security', rows: 1 },
    { title: 'Support', rows: 3 },
    { title: 'Legal', rows: 3 },
    { title: 'Sign Out & Delete', rows: 2 },
  ],
}: SettingsSkeletonProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header skeleton — mirrors page header layout */}
      <div className="flex items-center gap-3 px-4 pt-1 pb-4">
        <Skeleton style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 3, height: 8, background: 'rgba(15,23,42,0.10)', borderRadius: 1, flexShrink: 0 }} />
            <Skeleton className="h-2" style={{ width: 44 }} />
          </div>
          <Skeleton className="h-5" style={{ width: 96 }} />
        </div>
      </div>

      {/* Profile hero card skeleton — mirrors hero layout */}
      <div className="px-4 pb-4">
        <div
          className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
        >
          <Skeleton style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0 }} />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4" style={{ width: '45%' }} />
            <Skeleton className="h-3" style={{ width: '60%' }} />
          </div>
          <Skeleton style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0 }} />
        </div>
      </div>

      {/* Section list skeleton */}
      <div className="px-4 pb-32 space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Eyebrow — dispatch rule marker shape */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 3, height: 10, borderRadius: 1, background: 'rgba(15,23,42,0.10)', flexShrink: 0 }} />
              <Skeleton className="h-2.5" style={{ width: `${section.title.length * 7}px` }} />
            </div>

            {/* Section card */}
            <div style={{ borderRadius: 16, background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', overflow: 'hidden' }}>
              {Array.from({ length: section.rows }).map((_, rowIdx) => (
                <SkeletonRow key={rowIdx} isLast={rowIdx === section.rows - 1} index={rowIdx} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonRow({ isLast, index }: { isLast: boolean; index?: number }) {
  const widths = [42, 58, 50, 46, 54, 48];
  const subWidths = [55, 62, 58, 72, 65, 60];
  const i = (index ?? 0) % widths.length;
  const titleWidth = widths[i];
  const subtitleWidth = subWidths[i];

  return (
    <div className="relative min-h-[60px] px-4 py-3 flex items-center gap-3">
      <Skeleton className="rounded-[10px]" style={{ width: 36, height: 36, flexShrink: 0 }} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 rounded-md" style={{ width: `${titleWidth}%` }} />
        <Skeleton className="h-3 rounded-md" style={{ width: `${subtitleWidth}%` }} />
      </div>
      <Skeleton className="w-5 h-5 rounded" />
      {!isLast && (
        <div style={{ position: 'absolute', bottom: 0, left: 64, right: 0, height: '0.5px', background: 'rgba(15,23,42,0.06)' }} />
      )}
    </div>
  );
}
