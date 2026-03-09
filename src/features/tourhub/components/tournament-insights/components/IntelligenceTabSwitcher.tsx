/**
 * IntelligenceTabSwitcher - Tier 2 sub-tab pills
 */

import React from 'react';
import { cn } from '@/lib/utils';

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
            className={cn(
              "px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold",
              isActive
                ? "text-white"
                : "text-muted-foreground bg-muted"
            )}
            style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default IntelligenceTabSwitcher;
