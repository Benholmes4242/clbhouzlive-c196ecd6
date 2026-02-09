/**
 * ContentFilterPills - Shared filter pill component
 * Used by both Personal and Business profile Activity tabs
 * 
 * A-Grade standards: 44pt tap targets, active:scale feedback, semantic tokens
 */

import { cn } from '@/lib/utils';

export interface FilterOption {
  key: string;
  label: string;
}

interface ContentFilterPillsProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

export function ContentFilterPills({
  filters,
  activeFilter,
  onFilterChange,
  className,
}: ContentFilterPillsProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide', className)}>
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={cn(
            'flex-shrink-0 px-4 py-2.5 min-h-[44px] flex items-center rounded-full text-sm font-medium',
            'transition-all duration-150 active:scale-[0.95]',
            activeFilter === key
              ? 'bg-foreground text-background'
              : 'bg-card text-foreground border border-border hover:bg-muted/50'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
