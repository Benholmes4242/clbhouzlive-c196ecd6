/**
 * DetailTabPills - Shared Tier 2 sub-tab pills for game/trip detail sheets
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabConfig {
  key: string;
  label: string;
  count?: number;
}

interface DetailTabPillsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  layoutId: string;
}

export function DetailTabPills({ 
  tabs, 
  activeTab, 
  onTabChange, 
  layoutId 
}: DetailTabPillsProps) {
  return (
    <div className="flex items-center gap-2">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const label = tab.count !== undefined 
          ? `${tab.label} (${tab.count})` 
          : tab.label;
          
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
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
