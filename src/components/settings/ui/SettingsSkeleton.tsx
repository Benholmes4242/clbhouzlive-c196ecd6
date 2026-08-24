import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface SettingsSkeletonProps {
  /** Number of sections to show */
  sections?: Array<{ title: string; rows: number }>;
}

export function SettingsSkeleton({
  // A shell may never be larger than the settled state it resolves into.
  // The settled page is eight sections deep, but only the hero and the first
  // three are above the fold - modelling all eight promised ~1560px of page
  // before the data arrived.
  sections = [
    { title: 'Account', rows: 2 },
    { title: 'Identity & Creator', rows: 2 },
    { title: 'Privacy & Safety', rows: 5 },
  ],
}: SettingsSkeletonProps) {
  return (
    <div className="min-h-screen" style={{ background: A.CANVAS }}>
      {/* Header skeleton — mirrors page header layout */}
      <div className="flex items-center gap-3 px-4 pt-1 pb-4">
        <Skeleton variant="dark" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 3, height: 8, background: A.BORDER, borderRadius: 1, flexShrink: 0 }} />
            <Skeleton variant="dark" className="h-2" style={{ width: 44 }} />
          </div>
          <Skeleton variant="dark" className="h-5" style={{ width: 96 }} />
        </div>
      </div>

      {/* Profile hero card skeleton — mirrors hero layout */}
      <div className="px-4 pb-4">
        <div
          className="w-full flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
        >
          <Skeleton variant="dark" style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0 }} />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton variant="dark" className="h-4" style={{ width: '45%' }} />
            <Skeleton variant="dark" className="h-3" style={{ width: '60%' }} />
          </div>
          <Skeleton variant="dark" style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0 }} />
        </div>
      </div>

      {/* Section list skeleton */}
      <div className="px-4 pb-0 space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Eyebrow — canonical caps label skeleton */}
            <div style={{ marginBottom: 8 }}>
              <Skeleton variant="dark" className="h-2.5" style={{ width: `${section.title.length * 7}px` }} />
            </div>

            {/* Section card */}
            <div style={{ borderRadius: 16, background: A.PANEL, border: `1px solid ${A.BORDER}`, overflow: 'hidden' }}>
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
      <Skeleton variant="dark" className="rounded-[10px]" style={{ width: 36, height: 36, flexShrink: 0 }} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="dark" className="h-3.5 rounded-md" style={{ width: `${titleWidth}%` }} />
        <Skeleton variant="dark" className="h-3 rounded-md" style={{ width: `${subtitleWidth}%` }} />
      </div>
      <Skeleton variant="dark" className="w-5 h-5 rounded" />
      {!isLast && (
        <div style={{ position: 'absolute', bottom: 0, left: 64, right: 0, height: '0.5px', background: A.BORDER }} />
      )}
    </div>
  );
}
