/**
 * TabPills - V2 segmented pill tabs
 * Premium styling: slight elevation on active, breathing room
 * V3: Enhanced visual polish with better contrast and smoother animations
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { SheetTab } from './types';

interface TabPillsProps {
  activeTab: SheetTab;
  onTabChange: (tab: SheetTab) => void;
}

const TABS: { key: SheetTab; label: string }[] = [
  { key: 'upcoming', label: 'Games' },
  { key: 'past', label: 'Past' },
  { key: 'trips', label: 'Trips' },
];

export function TabPills({ activeTab, onTabChange }: TabPillsProps) {
  return (
    <div className="flex gap-1">
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "flex-1 py-2.5 px-4 text-[13px] font-semibold rounded-lg transition-all duration-150",
              isActive
                ? "bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]"
                : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
