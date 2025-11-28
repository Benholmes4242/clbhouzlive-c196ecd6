import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterPillsRowProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * iOS-style segmented filter control with grouped pills
 * Used across Reviews and Media tabs for consistent filtering UI
 */
export const FilterPillsRow: React.FC<FilterPillsRowProps> = ({
  options,
  activeId,
  onChange,
  className,
}) => {
  return (
    <section className={cn('px-4 pt-3 pb-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-500">
          Sort &amp; filter
        </p>
      </div>

      <div className="rounded-2xl bg-muted/70 px-1.5 py-1 flex justify-center gap-1.5 overflow-x-auto no-scrollbar">
        {options.map((option) => {
          const isActive = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                'px-3.5 py-1.5 text-sm whitespace-nowrap rounded-full border transition-all',
                isActive
                  ? 'bg-white text-slate-900 border-transparent shadow-sm'
                  : 'bg-transparent text-slate-600 border-slate-200/70'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
