/**
 * EchoTabPills - Tab switcher for Echo Chat/History
 * Clean tabs with white active state
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import { HUB_TAB_RAIL } from './echoStyles';

export type EchoTab = 'chat' | 'history';

interface EchoTabPillsProps {
  activeTab: EchoTab;
  onTabChange: (tab: EchoTab) => void;
}

const tabs: { id: EchoTab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'history', label: 'History' },
];

export function EchoTabPills({ activeTab, onTabChange }: EchoTabPillsProps) {
  const handleTabClick = (tab: EchoTab) => {
    if (tab !== activeTab) {
      haptic('light');
      onTabChange(tab);
    }
  };

  return (
    <div className={HUB_TAB_RAIL}>
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-[15px] font-semibold rounded-[10px] transition-all duration-150",
              activeTab === tab.id
                ? "bg-white text-[#1D1D1F] shadow-sm"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
