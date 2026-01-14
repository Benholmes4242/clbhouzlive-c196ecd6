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
      className="flex p-1 rounded-[12px]"
      style={{ background: '#e2e8f0' }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="relative flex-1 py-2 px-4 text-[13px] font-semibold rounded-[10px] transition-colors"
            style={{
              color: isActive ? '#1e293b' : '#64748b',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="game-detail-tab-pill-bg"
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
