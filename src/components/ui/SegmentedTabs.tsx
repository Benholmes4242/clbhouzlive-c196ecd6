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
 * SegmentedTabs — Pinpoint sub-tab pill (8px radius, foreground active)
 */
export function SegmentedTabs({ options, value, onChange, className = '' }: SegmentedTabsProps) {
  return (
    <div className={cn('flex items-center gap-5', className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="px-1 min-h-[36px] text-sm whitespace-nowrap transition-colors duration-200 active:scale-[0.97]"
            style={{
              background: 'transparent',
              border: 'none',
              fontWeight: isActive ? 800 : 500,
              color: isActive ? '#0F172A' : '#94A3B8',
              letterSpacing: isActive ? '-0.01em' : 0,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
