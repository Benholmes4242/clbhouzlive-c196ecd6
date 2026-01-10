/**
 * DiscoverTabPills - Tab pills for discover games sheet
 */

import React from 'react';
import type { DiscoverTab } from './DiscoverGamesBottomSheetV2';

interface DiscoverTabPillsProps {
  activeTab: DiscoverTab;
  onTabChange: (tab: DiscoverTab) => void;
}

const tabs: { key: DiscoverTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'recommended', label: 'Recommended' },
  // { key: 'friends', label: 'Friends' }, // Enable when friends filter is ready
];

export function DiscoverTabPills({ activeTab, onTabChange }: DiscoverTabPillsProps) {
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
            onClick={() => onTabChange(tab.key)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
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
