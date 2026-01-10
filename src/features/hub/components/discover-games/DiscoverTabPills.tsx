/**
 * DiscoverTabPills - Tab pills for discover sheet
 * Now uses Games | Trips tabs (removed Recommended/Upcoming)
 */

import React from 'react';
import { haptic } from '@/utils/haptics';

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
  const handleTabChange = (tab: DiscoverTab) => {
    haptic('light');
    onTabChange(tab);
  };

  return (
    <div 
      className="inline-flex items-center gap-1 p-1 rounded-full"
      style={{
        background: 'rgba(0, 0, 0, 0.04)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150"
            style={{
              background: isActive ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
              color: isActive ? '#1e293b' : 'rgba(71, 85, 105, 0.7)',
              boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
