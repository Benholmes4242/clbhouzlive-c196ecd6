/**
 * EditorialTabs - Tier 2 sub-filter tabs for Players page
 */

import { cn } from '@/lib/utils';

export type PlayerFilterType = 'all' | 'top-ranked' | 'most-active' | 'rookies';

interface EditorialTabsProps {
  activeFilter: PlayerFilterType;
  onFilterChange: (filter: PlayerFilterType) => void;
  counts?: {
    all: number;
    topRanked: number;
    mostActive: number;
    rookies: number;
  };
}

const TABS: { value: PlayerFilterType; label: string; countKey: keyof NonNullable<EditorialTabsProps['counts']> }[] = [
  { value: 'all', label: 'The Field', countKey: 'all' },
  { value: 'top-ranked', label: 'Elite', countKey: 'topRanked' },
  { value: 'most-active', label: 'On Tour', countKey: 'mostActive' },
  { value: 'rookies', label: 'Next Wave', countKey: 'rookies' },
];

export function EditorialTabs({ activeFilter, onFilterChange, counts }: EditorialTabsProps) {
  return (
    <div 
      className="py-2"
      role="tablist"
      aria-label="Filter players"
    >
      <div 
        className="flex items-stretch rounded-[14px] overflow-hidden p-[3px]"
        style={{ background: 'rgba(0, 0, 0, 0.03)' }}
      >
        {TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          const count = counts?.[tab.countKey];

          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                "relative flex-1 py-2.5 text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                "min-h-[44px]",
                isActive 
                  ? "bg-card text-foreground font-semibold rounded-xl" 
                  : "text-muted-foreground rounded-xl"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    "text-[10px] font-normal tabular-nums",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                  )}>
                    {count > 999 ? '999+' : count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
