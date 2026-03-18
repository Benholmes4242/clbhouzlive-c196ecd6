/**
 * TripDetailTabPills - Pinpoint sub-tab pills (8px, foreground active)
 */

import React from 'react';

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
    <div className="flex items-center gap-2">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="px-4 min-h-[36px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold"
            style={{
              borderRadius: 8,
              background: isActive ? 'hsl(var(--foreground))' : 'transparent',
              color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
              border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
