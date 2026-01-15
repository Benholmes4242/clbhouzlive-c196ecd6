/**
 * DiscoverTabPills - Tab pills for discover sheet
 * Now uses Games | Trips tabs with animated background pill
 */

import React from 'react';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

export type DiscoverTab = 'games' | 'trips';

interface DiscoverTabPillsProps {
  activeTab: DiscoverTab;
  onTabChange: (tab: DiscoverTab) => void;
}

const tabs: { key: DiscoverTab; label: string }[] = [
  { key: 'games', label: 'Games' },
  { key: 'trips', label: 'Trips' },
];

export function DiscoverTabPills({ activeTab, onTabChange }: DiscoverTabPillsProps) {
  return (
    <div className="flex p-1 rounded-xl bg-[#e2e8f0]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => {
              haptic('light');
              onTabChange(tab.key);
            }}
            className={cn(
              "flex-1 py-2 px-4 text-[13px] font-semibold rounded-lg transition-all duration-150",
              isActive
                ? "m-1 bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]"
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
