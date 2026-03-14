import React from 'react';
import { cn } from '@/lib/utils';

type FilterVariant = 'default' | 'warning' | 'danger' | 'success';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  variant?: FilterVariant;
}

interface AdminFilterBarProps {
  filters: FilterOption[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

const COUNT_COLORS: Record<FilterVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  danger:  'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
};

export function AdminFilterBar({ filters, active, onChange, className }: AdminFilterBarProps) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {filters.map((filter) => {
        const isActive = active === filter.id;
        const variant = filter.variant ?? 'default';

        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all duration-100 active:scale-[0.97]',
              isActive
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className={cn('min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold', isActive ? 'bg-background/20 text-background' : COUNT_COLORS[variant])}>
                {filter.count > 999 ? '999+' : filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
