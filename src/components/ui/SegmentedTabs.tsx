import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedTabOption {
  value: string;
  label: string;
}

interface SegmentedTabsProps {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Global SegmentedTabs — Tier 2 sub-tab pill
 * Active: #475569 filled pill, no underline
 */
export function SegmentedTabs({ options, value, onChange, className = '' }: SegmentedTabsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold',
              isActive
                ? 'text-white'
                : 'text-muted-foreground bg-muted'
            )}
            style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
