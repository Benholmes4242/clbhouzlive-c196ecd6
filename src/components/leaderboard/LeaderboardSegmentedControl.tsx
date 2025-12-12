import React from 'react';
import { cn } from '@/lib/utils';

export type LeaderboardSegment = 'top100' | 'around' | 'friends' | 'rising';

interface LeaderboardSegmentedControlProps {
  value: LeaderboardSegment;
  onChange: (segment: LeaderboardSegment) => void;
  disabledSegments?: LeaderboardSegment[];
}

const SEGMENTS: { value: LeaderboardSegment; label: string }[] = [
  { value: 'top100', label: 'Top 100' },
  { value: 'around', label: 'Around You' },
  { value: 'friends', label: 'Friends' },
  { value: 'rising', label: 'Rising' },
];

export function LeaderboardSegmentedControl({
  value,
  onChange,
  disabledSegments = [],
}: LeaderboardSegmentedControlProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
      <div className="inline-flex rounded-sq-pill bg-muted/60 p-1 text-xs font-medium min-w-max">
        {SEGMENTS.map((seg) => {
          const isDisabled = disabledSegments.includes(seg.value);
          const isActive = value === seg.value;

          return (
            <button
              key={seg.value}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(seg.value)}
              className={cn(
                'px-3 py-1.5 rounded-sq-pill transition-all whitespace-nowrap',
                isActive
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground',
                isDisabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
