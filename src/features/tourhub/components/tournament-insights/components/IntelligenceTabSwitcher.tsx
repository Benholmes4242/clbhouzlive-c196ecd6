/**
 * IntelligenceTabSwitcher - Underline-style sub-tab toggle
 * Used within Upcoming view for Top 5 Picks / Course DNA switching
 */

import React from 'react';

type IntelligenceTab = 'courseDNA' | 'predictions';

interface IntelligenceTabSwitcherProps {
  activeTab: IntelligenceTab;
  onTabChange: (tab: IntelligenceTab) => void;
  picksFirst?: boolean;
}

const IntelligenceTabSwitcher: React.FC<IntelligenceTabSwitcherProps> = ({
  activeTab,
  onTabChange,
  picksFirst = false,
}) => {
  const options = picksFirst
    ? [
        { label: 'Top 5 Picks', value: 'predictions' as const },
        { label: 'Course DNA', value: 'courseDNA' as const },
      ]
    : [
        { label: 'Course DNA', value: 'courseDNA' as const },
        { label: 'Top 5 Picks', value: 'predictions' as const },
      ];

  return (
    <div
      className="flex mb-4"
      style={{
        borderBottom: '1px solid hsl(var(--border))',
        maxWidth: 320,
      }}
    >
      {options.map((opt) => {
        const isActive = activeTab === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onTabChange(opt.value)}
            className="relative flex-1 transition-colors duration-200"
            style={{
              padding: '12px 0',
              fontSize: 13,
              fontWeight: 600,
              color: isActive
                ? 'hsl(var(--foreground))'
                : 'hsl(var(--muted-foreground))',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {opt.label}
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
    </div>
  );
};

export default IntelligenceTabSwitcher;
