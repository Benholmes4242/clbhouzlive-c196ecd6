/**
 * IntelligenceTabSwitcher - Refined pill-style sub-tab toggle
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
      className="flex bg-muted mb-4"
      style={{
        borderRadius: 12,
        padding: 3,
        maxWidth: 320,
      }}
    >
      {options.map((opt) => {
        const isActive = activeTab === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onTabChange(opt.value)}
            className="flex-1 transition-all duration-200"
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: isActive
                ? 'hsl(var(--foreground))'
                : 'hsl(var(--muted-foreground))',
              background: isActive ? 'hsl(var(--background))' : 'transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default IntelligenceTabSwitcher;
