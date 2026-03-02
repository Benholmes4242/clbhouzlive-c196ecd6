/**
 * LiveUpcomingToggle - Underline-style tab bar
 * Replaces SegmentedControl with minimal underline tabs
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
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex-1 flex items-center justify-center gap-1.5 transition-colors duration-200"
            style={{
              padding: '12px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: isActive
                ? 'hsl(var(--foreground))'
                : 'hsl(var(--muted-foreground))',
              background: 'none',
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
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  backgroundColor: 'hsl(var(--foreground))',
                  borderRadius: 1,
                }}
              />
            )}
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
