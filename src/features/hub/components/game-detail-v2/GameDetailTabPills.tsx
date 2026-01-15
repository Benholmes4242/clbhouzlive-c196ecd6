/**
 * GameDetailTabPills - Pill tabs for game detail sheet
 * Matches TabPills design from YourGamesTripsSheetV2
 */

import React from 'react';
import { cn } from '@/lib/utils';

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
    <div className="flex p-1 rounded-xl bg-[#e2e8f0]">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
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
