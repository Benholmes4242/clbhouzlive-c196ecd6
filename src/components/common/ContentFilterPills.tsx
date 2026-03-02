/**
 * ContentFilterPills - Canonical Tier 2 orange-underline sub-tabs
 * Used by both Personal and Business profile Activity tabs
 * 
 * Matches IntelligenceTabSwitcher: centered, transparent track,
 * orange underline on active, 44px tap targets, framer-motion layoutId.
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {filters.map(({ key, label }) => {
        const isActive = activeFilter === key;
        return (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={cn(
              'relative px-3 py-2 min-h-[44px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97]',
              isActive
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground font-medium hover:text-foreground'
            )}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {label}
            {isActive && (
              <motion.div
                layoutId="content-filter-underline"
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[hsl(var(--tab-orange))]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
