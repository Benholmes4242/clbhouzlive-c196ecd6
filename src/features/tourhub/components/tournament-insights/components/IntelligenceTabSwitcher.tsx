/**
 * IntelligenceTabSwitcher - Pinpoint sub-tab pills (8px, foreground active)
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
    <div className="flex items-center justify-center gap-2 mb-4">
      {options.map((opt) => {
        const isActive = activeTab === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onTabChange(opt.value)}
            className="px-4 min-h-[36px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold"
            style={{
              borderRadius: 8,
              background: isActive ? 'hsl(var(--foreground))' : 'transparent',
              color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
              border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
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
