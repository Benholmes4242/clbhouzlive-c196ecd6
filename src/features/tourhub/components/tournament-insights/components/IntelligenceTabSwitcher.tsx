/**
 * IntelligenceTabSwitcher - Matches LiveUpcomingToggle style
 * Transparent track, white active pill with shadow
 */

import React from 'react';
import { cn } from '@/lib/utils';

type IntelligenceTab = 'courseDNA' | 'predictions';

interface IntelligenceTabSwitcherProps {
  activeTab: IntelligenceTab;
  onTabChange: (tab: IntelligenceTab) => void;
}

const IntelligenceTabSwitcher: React.FC<IntelligenceTabSwitcherProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: IntelligenceTab; label: string }[] = [
    { id: 'courseDNA', label: 'Course DNA' },
    { id: 'predictions', label: 'Top 5 Picks' },
  ];

  return (
    <div className="flex items-stretch rounded-xl overflow-hidden bg-transparent mb-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98] flex items-center justify-center",
              isActive
                ? "bg-foreground text-background m-1 rounded-lg"
                : "text-muted-foreground hover:text-foreground rounded-lg active:bg-card/50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default IntelligenceTabSwitcher;
