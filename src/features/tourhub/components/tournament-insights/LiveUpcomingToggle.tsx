/**
 * LiveUpcomingToggle - Segmented control matching CourseTabs style
 * Shows green pulsing dot on "Live" when active
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { IntelligenceView } from './types';

interface LiveUpcomingToggleProps {
  activeView: IntelligenceView;
  onViewChange: (view: IntelligenceView) => void;
  hasUpcoming?: boolean;
  isLive?: boolean;
}

export const LiveUpcomingToggle: React.FC<LiveUpcomingToggleProps> = ({
  activeView,
  onViewChange,
  hasUpcoming = true,
  isLive = false,
}) => {
  const tabs: { id: IntelligenceView; label: string }[] = [
    { id: 'live', label: isLive ? 'Live' : 'Current' },
    { id: 'upcoming', label: 'Next Up' },
  ];

  return (
    <div className="flex items-stretch rounded-xl overflow-hidden bg-secondary">
      {tabs.map((tab) => {
        if (tab.id === 'upcoming' && !hasUpcoming) return null;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={cn(
              "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98] flex items-center justify-center gap-1.5",
              isActive
                ? "bg-card text-foreground shadow-sm m-1 rounded-lg"
                : "text-muted-foreground hover:text-foreground rounded-lg active:bg-card/50"
            )}
          >
            {tab.id === 'live' && isActive && isLive && (
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{
                  backgroundColor: '#22c55e',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
