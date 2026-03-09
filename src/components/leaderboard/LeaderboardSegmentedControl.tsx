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
      <div className="flex items-center gap-2 min-w-max">
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
                'px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground bg-muted',
                isDisabled && 'opacity-40 cursor-not-allowed'
              )}
              style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
