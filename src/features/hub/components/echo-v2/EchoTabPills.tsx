/**
 * EchoTabPills - Tab switcher for Echo Chat/History
 * Warm styling to match Hub sheets
 */

import React from 'react';
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
    <div className="flex bg-[#F5EDE5] rounded-[14px] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 py-2.5 rounded-[10px] text-[15px] font-semibold transition-all duration-150 ${
            activeTab === tab.id
              ? "bg-white shadow-sm text-[#1D1D1F]"
              : "text-[#86868B] hover:text-[#1D1D1F]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
