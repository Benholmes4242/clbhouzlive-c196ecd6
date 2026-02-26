/**
 * TripDetailTabPills - Pill tabs for trip detail sheet
 * Orange underline with animated sliding
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    <div className="flex items-center gap-1">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative flex-1 py-2 px-3 text-sm min-h-[44px] whitespace-nowrap transition-all duration-200 active:scale-[0.97]",
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground font-medium hover:text-foreground"
            )}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="trip-detail-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
                style={{ background: 'hsl(var(--tab-orange))' }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
