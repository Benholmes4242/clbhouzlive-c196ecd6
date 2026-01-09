/**
 * TabPills - Segmented pill tabs matching V2 design
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { SheetTab } from './types';

interface TabPillsProps {
  activeTab: SheetTab;
  onTabChange: (tab: SheetTab) => void;
}

const TABS: { key: SheetTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'trips', label: 'Trips' },
];

export function TabPills({ activeTab, onTabChange }: TabPillsProps) {
  return (
    <div 
      className="flex gap-1.5 p-1 rounded-[14px]"
      style={{
        background: 'rgba(0, 0, 0, 0.04)',
      }}
    >
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="relative flex-1 py-1.5 px-3 text-[13px] font-medium rounded-[10px] transition-colors duration-150"
            style={{
              color: isActive ? '#1e293b' : 'rgba(30, 41, 59, 0.55)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-pill-bg"
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
