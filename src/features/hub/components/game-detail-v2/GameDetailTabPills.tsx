/**
 * GameDetailTabPills - Tier 2 sub-tab pills
 * Active: #475569 filled pill
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
    <div className="flex items-center gap-2">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold",
              isActive
                ? "text-white"
                : "text-muted-foreground bg-muted"
            )}
            style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
