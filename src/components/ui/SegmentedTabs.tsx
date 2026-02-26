import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
 * Global SegmentedTabs component — orange underline pattern
 */
export function SegmentedTabs({ options, value, onChange, className = '' }: SegmentedTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList 
        className={cn(
          'flex items-center gap-1 bg-transparent border-0 p-0 h-auto',
          className
        )}
      >
        {options.map((option) => (
          <TabsTrigger 
            key={option.value}
            value={option.value}
            className="relative text-sm px-3 py-2 min-h-[44px] font-medium bg-transparent border-0 shadow-none rounded-none
              data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:font-semibold
              text-muted-foreground hover:text-foreground
              active:scale-[0.97] transition-all duration-200
              after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:transition-all after:duration-200
              data-[state=active]:after:bg-[hsl(var(--tab-orange))]
              data-[state=inactive]:after:bg-transparent"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
