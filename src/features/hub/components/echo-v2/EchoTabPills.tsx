/**
 * EchoTabPills - Tab switcher for Echo Chat/History
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
    <div 
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: 'hsl(var(--muted) / 0.5)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "flex-1 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
