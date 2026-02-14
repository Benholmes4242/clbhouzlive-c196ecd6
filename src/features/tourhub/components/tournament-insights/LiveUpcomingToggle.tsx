/**
 * LiveUpcomingToggle - Pill-style toggle matching IntelligenceTabSwitcher
 * Shows green pulsing dot on "Live" when active
 */

import React from 'react';
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
    <div
      className="flex p-1 rounded-[14px] border border-border"
      style={{ background: '#F1F3F5' }}
    >
      {tabs.map((tab) => {
        if (tab.id === 'upcoming' && !hasUpcoming) return null;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className="flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-[11px] transition-all duration-300 active:scale-95"
            style={{
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#1C1917' : '#78716C',
              background: isActive ? 'hsl(var(--card))' : 'transparent',
              border: isActive ? '1px solid hsl(var(--border))' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
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
