/**
 * EchoTabPills - Tab switcher for Echo Chat/History
 * Polished with smooth transitions and proper touch targets
 */

import React from 'react';
import { motion } from 'framer-motion';
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
        "flex items-center gap-1 p-1 rounded-xl relative",
        HUB_TAB_RAIL
      )}
      role="tablist"
      aria-label="Echo tabs"
    >
      {/* Animated background pill */}
      <motion.div
        className="absolute inset-y-1 rounded-lg bg-white shadow-sm"
        initial={false}
        animate={{
          left: activeTab === 'chat' ? 4 : '50%',
          right: activeTab === 'chat' ? '50%' : 4,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{ zIndex: 0 }}
      />

      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "relative z-10 flex-1 min-h-[36px] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors duration-200",
            activeTab === tab.id
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          )}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
