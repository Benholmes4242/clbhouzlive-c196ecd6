/**
 * ContentFilterPills - Pinpoint sub-tab pills (8px radius, foreground active)
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
            className="px-4 min-h-[36px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold"
            style={{
              borderRadius: 8,
              background: isActive ? 'hsl(var(--foreground))' : 'transparent',
              color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
              border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
