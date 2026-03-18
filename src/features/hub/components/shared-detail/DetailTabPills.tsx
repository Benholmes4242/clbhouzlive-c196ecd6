/**
 * DetailTabPills - Pinpoint sub-tab pills (8px, foreground active)
 */

import React from 'react';

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
