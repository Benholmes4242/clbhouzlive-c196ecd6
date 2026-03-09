/**
 * ContentFilterPills - Tier 2 sub-tab pills
 * Used by both Personal and Business profile Activity tabs
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
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {filters.map(({ key, label }) => {
        const isActive = activeFilter === key;
        return (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={cn(
              'px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold',
              isActive
                ? 'text-white'
                : 'text-muted-foreground bg-muted'
            )}
            style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
