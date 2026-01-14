/**
 * TabPills - V2 segmented pill tabs
 * Premium styling: slight elevation on active, breathing room
 * V3: Enhanced visual polish with better contrast and smoother animations
 */

import React from 'react';
import { motion } from 'framer-motion';
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
            className="relative flex-1 py-2.5 px-4 text-[13px] font-semibold rounded-[10px] transition-colors duration-150"
            style={{
              color: isActive ? '#1e293b' : '#64748b',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-pill-bg-v3"
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
