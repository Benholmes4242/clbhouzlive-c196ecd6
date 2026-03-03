import React from 'react';
import { cn } from '@/lib/utils';

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
    { title: 'Notifications', rows: 2 },
    { title: 'Security', rows: 1 },
    { title: 'Support', rows: 3 },
    { title: 'Legal', rows: 3 },
    { title: 'Danger Zone', rows: 1 },
  ]
}: SettingsSkeletonProps) {
  return (
    <div className="space-y-8 px-4">
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {/* Section title skeleton */}
          <div className="mb-3 ml-1">
            <div 
              className="h-2.5 rounded animate-pulse bg-muted"
              style={{ width: `${section.title.length * 7}px` }}
            />
          </div>

          {/* Rows */}
          <div>
            {Array.from({ length: section.rows }).map((_, rowIdx) => (
              <SkeletonRow 
                key={rowIdx} 
                isLast={rowIdx === section.rows - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonRow({ isLast }: { isLast: boolean }) {
  const titleWidth = 42 + Math.random() * 16;
  const subtitleWidth = 55 + Math.random() * 17;

  return (
    <div className="relative min-h-[60px] px-4 py-3 flex items-center gap-3">
      {/* Icon container skeleton */}
      <div className="w-10 h-10 rounded-xl animate-pulse bg-muted" />

      {/* Text content */}
      <div className="flex-1 space-y-2">
        <div 
          className="h-3.5 rounded-md animate-pulse bg-muted"
          style={{ width: `${titleWidth}%` }}
        />
        <div 
          className="h-3 rounded-md animate-pulse bg-muted/60"
          style={{ width: `${subtitleWidth}%` }}
        />
      </div>

      {/* Right control skeleton */}
      <div className="w-5 h-5 rounded animate-pulse bg-muted/60" />

      {/* Divider */}
      {!isLast && (
        <div className="absolute bottom-0 left-16 right-0 h-px bg-border/40" />
      )}
    </div>
  );
}
