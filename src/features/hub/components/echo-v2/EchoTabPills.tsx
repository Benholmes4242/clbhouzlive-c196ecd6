/**
 * EchoTabPills - Tab switcher for Echo Chat/History
 * Explicit light styling to match Hub sheets
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';


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
    <div className="flex p-1 rounded-xl bg-[#e2e8f0]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "flex-1 py-2 px-4 text-[13px] font-semibold rounded-lg transition-all duration-150",
            activeTab === tab.id
              ? "m-1 bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]"
              : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
