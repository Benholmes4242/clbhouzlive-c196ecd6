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
        className={`grid w-full bg-muted/70 border border-border/60 px-2 py-[3px] ${className}`}
        style={{ 
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          borderRadius: 'var(--radius)'
        }}
      >
        {options.map((option) => (
          <TabsTrigger 
            key={option.value}
            value={option.value}
            className="text-sm px-3 py-[6px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}