import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SegmentedTabs({ tabs, activeTab, onTabChange }: SegmentedTabsProps) {
  return (
    <div className="flex justify-center py-3">
      <div className="inline-flex items-center rounded-full bg-muted/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-all",
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
