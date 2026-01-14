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
  const handleTabChange = (tab: DiscoverTab) => {
    haptic('light');
    onTabChange(tab);
  };

  return (
    <div 
      className="inline-flex items-center gap-1 p-1 rounded-full relative"
      style={{
        background: 'transparent',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium relative z-10 transition-colors duration-150"
            style={{
              color: isActive ? '#1e293b' : 'rgba(71, 85, 105, 0.6)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="discover-tab-pill"
                className="absolute inset-0 rounded-full -z-10"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
