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
    <div className={cn('flex items-center gap-2', className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="px-4 min-h-[36px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold"
            style={{
              borderRadius: 8,
              background: isActive ? '#0F172A' : 'transparent',
              color: isActive ? '#ffffff' : '#64748B',
              border: isActive ? 'none' : '1px solid rgba(15,23,42,0.10)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
