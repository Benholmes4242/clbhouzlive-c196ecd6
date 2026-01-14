/**
 * TripDetailTabPills - Pill tabs for trip detail sheet
 * Matches GameDetailTabPills design exactly
 */

import React from 'react';
import { motion } from 'framer-motion';

export type TripDetailTab = 'details' | 'messages' | 'players';

interface TripDetailTabPillsProps {
  activeTab: TripDetailTab;
  onTabChange: (tab: TripDetailTab) => void;
  participantCount: number;
}

export function TripDetailTabPills({ 
  activeTab, 
  onTabChange,
  participantCount,
}: TripDetailTabPillsProps) {
  const tabs: { key: TripDetailTab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'messages', label: 'Messages' },
    { key: 'players', label: `Players (${participantCount})` },
  ];

  return (
    <div 
      className="flex p-1 rounded-[12px]"
      style={{ background: 'rgba(0, 0, 0, 0.04)' }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="relative flex-1 py-2 px-4 text-[13px] font-semibold rounded-[10px] transition-colors"
            style={{
              color: isActive ? '#1e293b' : 'rgba(100, 116, 139, 0.65)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="trip-detail-tab-pill-bg"
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
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
