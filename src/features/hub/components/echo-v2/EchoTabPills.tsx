/**
 * EchoTabPills - Tab switcher for Echo Chat/History
 * Explicit light styling to match Hub sheets
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
    <div 
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl",
        HUB_TAB_RAIL
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "flex-1 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150",
            activeTab === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
