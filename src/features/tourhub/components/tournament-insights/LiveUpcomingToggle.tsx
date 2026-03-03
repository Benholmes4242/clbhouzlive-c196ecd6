/**
 * LiveUpcomingToggle - Pill-style segmented tab bar
 * Used for primary view switching (Next Up / Results / Live)
 */

import React from 'react';

interface TabItem {
  id: string;
  label: string;
  hasLiveDot?: boolean;
}

interface LiveUpcomingToggleProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const LiveUpcomingToggle: React.FC<LiveUpcomingToggleProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  if (tabs.length <= 1) return null;

  return (
    <div
      className="flex"
      style={{
        borderRadius: 12,
        padding: 3,
        maxWidth: 320,
        gap: 4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 whitespace-nowrap"
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: isActive
                ? 'hsl(var(--background))'
                : 'hsl(var(--muted-foreground))',
              background: isActive ? 'hsl(var(--foreground))' : 'transparent',
              boxShadow: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.hasLiveDot && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'hsl(var(--destructive))',
                  animation: 'liveDot 2s infinite',
                  flexShrink: 0,
                }}
              />
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}

      <style>{`
        @keyframes liveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
