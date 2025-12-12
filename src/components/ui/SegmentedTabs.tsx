import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
 * Global SegmentedTabs component
 * Uses consistent styling across all tabs in the application
 * - Uses global radius token (var(--radius) = 0.5rem/8px)
 * - Matches Golf Courses page tab styling
 * - Reusable for any tabbed interface
 */
export function SegmentedTabs({ options, value, onChange, className = '' }: SegmentedTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList 
        className={`grid w-full rounded-sq-md bg-muted/70 border border-border/60 px-1.5 py-1 ${className}`}
        style={{ 
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`
        }}
      >
        {options.map((option) => (
          <TabsTrigger 
            key={option.value}
            value={option.value}
            className="rounded-sq-sm text-sm px-3 py-1.5 font-medium 
              data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=active]:font-semibold
              text-muted-foreground hover:text-foreground 
              active:scale-[0.97] 
              transition-all duration-motion-fast ease-standard"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}