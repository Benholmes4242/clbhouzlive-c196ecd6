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
      <div className="flex items-center gap-1 min-w-max">
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
                'relative px-3 py-2 min-h-[44px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97]',
                'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:transition-all after:duration-200',
                isActive
                  ? 'text-foreground font-semibold after:bg-[hsl(var(--tab-orange))]'
                  : 'text-muted-foreground font-medium hover:text-foreground after:bg-transparent',
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
