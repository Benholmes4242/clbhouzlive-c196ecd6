/**
 * DetailTabPills - Shared tabs for game/trip detail sheets
 * Orange underline with animated sliding via Framer Motion layoutId
 */

import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="flex items-center gap-1">
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
              'relative flex-1 py-2 px-3 text-sm min-h-[44px] whitespace-nowrap transition-all duration-200 active:scale-[0.97]',
              isActive
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground font-medium hover:text-foreground'
            )}
          >
            {label}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
                style={{ background: 'hsl(var(--tab-orange))' }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
