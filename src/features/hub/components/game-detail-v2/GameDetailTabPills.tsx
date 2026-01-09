/**
 * GameDetailTabPills - Pill tabs for game detail sheet
 * Matches TabPills design from YourGamesTripsSheetV2
 */

import React from 'react';
import { motion } from 'framer-motion';

type GameDetailTab = 'details' | 'messages' | 'participants';

interface GameDetailTabPillsProps {
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
  participantCount: number;
}

export function GameDetailTabPills({ 
  activeTab, 
  onTabChange,
  participantCount,
}: GameDetailTabPillsProps) {
  const tabs: { key: GameDetailTab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'messages', label: 'Messages' },
    { key: 'participants', label: `Players (${participantCount})` },
  ];

  return (
    <div 
      className="flex gap-1.5 p-1 rounded-[14px]"
      style={{
        background: 'rgba(0, 0, 0, 0.04)',
      }}
    >
      {tabs.map(tab => {
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
                layoutId="game-detail-tab-pill-bg"
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
