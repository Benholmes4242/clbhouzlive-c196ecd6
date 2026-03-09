import React from 'react';
import { cn } from '@/lib/utils';

export interface PillOption {
  id: string;
  label: string;
}

interface PillTabsProps {
  options: PillOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * PillTabs — Tier 2 sub-tab pill
 * Active: #475569 filled pill, no underline
 */
export const PillTabs: React.FC<PillTabsProps> = ({
  options,
  activeId,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold',
              isActive
                ? 'text-white'
                : 'text-muted-foreground bg-muted'
            )}
            style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
