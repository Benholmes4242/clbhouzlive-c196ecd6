import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingsSkeletonProps {
  /** Number of sections to show */
  sections?: Array<{ title: string; rows: number }>;
}

/**
 * SettingsSkeleton - Loading state matching cardless design
 */
export function SettingsSkeleton({ 
  sections = [
    { title: 'Account', rows: 3 },
    { title: 'Identity & Creator', rows: 3 },
    { title: 'Privacy & Safety', rows: 3 },
    { title: 'Notifications', rows: 1 },
    { title: 'Security', rows: 1 },
    { title: 'Support', rows: 3 },
    { title: 'Legal', rows: 3 },
    { title: 'Account', rows: 2 },
  ]
}: SettingsSkeletonProps) {
  return (
    <div className="space-y-8 px-4">
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {/* Section title skeleton */}
          <div className="mb-3 ml-1">
            <Skeleton 
              className="h-2.5"
              style={{ width: `${section.title.length * 7}px` }}
            />
          </div>

          {/* Rows */}
          <div>
            {Array.from({ length: section.rows }).map((_, rowIdx) => (
              <SkeletonRow 
                key={rowIdx} 
                isLast={rowIdx === section.rows - 1}
                index={rowIdx}
              />
            ))}
          </div>
        </div>
      ))}
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
      {/* Icon container skeleton */}
      <Skeleton className="w-10 h-10 rounded-xl" />

      {/* Text content */}
      <div className="flex-1 space-y-2">
        <Skeleton 
          className="h-3.5 rounded-md"
          style={{ width: `${titleWidth}%` }}
        />
        <Skeleton 
          className="h-3 rounded-md"
          style={{ width: `${subtitleWidth}%` }}
        />
      </div>

      {/* Right control skeleton */}
      <Skeleton className="w-5 h-5 rounded" />

      {/* Divider */}
      {!isLast && (
        <div className="absolute bottom-0 left-16 right-0 h-px bg-border/40" />
      )}
    </div>
  );
}