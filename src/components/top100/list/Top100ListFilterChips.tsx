import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type Top100FilterChip = 'official' | 'community' | 'played' | 'unplayed';

interface Top100ListFilterChipsProps {
  activeFilter: Top100FilterChip;
  onFilterChange: (filter: Top100FilterChip) => void;
  counts?: Partial<Record<Top100FilterChip, number>>;
  isSticky?: boolean;
}

// Same tab trigger class as CourseTabs.tsx - centered text with orange underline
const tabTriggerClass = "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]";

/**
 * Tab-style filter navigation for Top 100 list.
 * Matches the exact styling of CourseTabs (About/Reviews/Media).
 */
export const Top100ListFilterChips: React.FC<Top100ListFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  counts = {},
  isSticky = false,
}) => {
  return (
    <div 
      className={`px-4 pt-3 pb-2 transition-all ${
        isSticky 
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm' 
          : 'bg-slate-50 border-b border-slate-200/60'
      }`}
    >
      <Tabs 
        value={activeFilter} 
        onValueChange={(v) => onFilterChange(v as Top100FilterChip)} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 bg-transparent border-0 px-0 py-0 gap-0">
          <TabsTrigger value="official" className={tabTriggerClass}>
            Official
          </TabsTrigger>
          <TabsTrigger value="community" className={tabTriggerClass}>
            Community
          </TabsTrigger>
          <TabsTrigger value="played" className={tabTriggerClass}>
            Played
            {counts.played !== undefined && counts.played > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">
                ({counts.played})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unplayed" className={tabTriggerClass}>
            Unplayed
            {counts.unplayed !== undefined && counts.unplayed > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">
                ({counts.unplayed})
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
