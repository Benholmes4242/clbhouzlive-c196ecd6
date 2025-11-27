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
 * Shared pill-style tab component used across Media and Reviews tabs.
 * Selected state uses light slate background with consistent styling.
 */
export const PillTabs: React.FC<PillTabsProps> = ({
  options,
  activeId,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              'border',
              isActive
                ? 'bg-slate-100 text-slate-900 border-slate-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
