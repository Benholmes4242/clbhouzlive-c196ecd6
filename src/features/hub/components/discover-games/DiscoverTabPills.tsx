/**
 * DiscoverTabPills - Tab pills for discover sheet
 * Now uses Games | Trips tabs with animated background pill
 */

import React from 'react';
import { motion } from 'framer-motion';
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
  return (
    <div
      className="flex p-1 rounded-[12px]"
      style={{
        background: 'rgba(0, 0, 0, 0.04)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => {
              haptic('light');
              onTabChange(tab.key);
            }}
            className="relative flex-1 py-2 px-4 text-[13px] font-semibold rounded-[10px] transition-colors duration-150"
            style={{
              color: isActive ? '#1e293b' : 'rgba(100, 116, 139, 0.65)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="discover-tab-pill"
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
