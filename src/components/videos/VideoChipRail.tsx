import React, { useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

export type LengthKey = 'all' | 'shorts' | 'under4' | '4to20' | 'over20';

const MAP: Record<LengthKey, string> = {
  all: 'All',
  shorts: 'Shorts',
  under4: 'Under 4 mins',
  '4to20': '4–20 mins',
  over20: 'Over 20 mins',
};

type Props = {
  value: LengthKey;
  onChange: (v: LengthKey) => void;
  className?: string;
};

export default function VideoChipRail({ value, onChange, className }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const chips = useMemo(() => Object.entries(MAP), []);

  return (
    <div className={cn('relative', className)}>
      {/* Scrollable horizontal rail */}
      <div
        ref={railRef}
        role="tablist"
        aria-label="Filter videos by length"
        className={cn(
          'flex items-center gap-3',
          'overflow-x-auto overscroll-x-contain snap-x snap-mandatory',
          'scroll-px-4 pl-1 pr-4 -mr-4',
          'no-scrollbar touch-pan-x select-none',
          'sticky top-0 z-5 py-3 bg-white/95 backdrop-blur-sm border-b border-black/[0.06]'
        )}
      >
        {chips.map(([k, label]) => {
          const selected = k === value;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(k as LengthKey)}
              className={cn(
                'shrink-0 snap-start',
                'px-4 h-10 rounded-xl border transition-colors font-semibold text-[15px]',
                'bg-white border-black/[0.08] text-black',
                selected && 'bg-black text-white border-black',
                'focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-0'
              )}
            >
              {label}
            </button>
          );
        })}
        {/* end spacer so last chip isn't flush */}
        <div className="shrink-0 w-2" />
      </div>
    </div>
  );
}
