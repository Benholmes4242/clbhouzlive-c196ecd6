/**
 * EchoTabPills - Tab switcher for Echo Chat/History
 * Explicit light styling to match Hub sheets
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import { ECHO_ORANGE } from './echoStyles';

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
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: '#e2e8f0' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200",
            activeTab === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
