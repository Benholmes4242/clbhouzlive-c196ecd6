/**
 * DetailTabPills - Shared pill tabs for game/trip detail sheets
 * Unified component to replace GameDetailTabPills and TripDetailTabPills
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface TabConfig {
  key: string;
  label: string;
  count?: number;
}

interface DetailTabPillsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  layoutId: string; // Unique per sheet to avoid animation conflicts
}

export function DetailTabPills({ 
  tabs, 
  activeTab, 
  onTabChange, 
  layoutId 
}: DetailTabPillsProps) {
  return (
    <div 
      className="flex gap-1.5 p-1 rounded-[14px]"
      style={{
        background: 'rgba(0, 0, 0, 0.04)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const label = tab.count !== undefined 
          ? `${tab.label} (${tab.count})` 
          : tab.label;
          
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="relative flex-1 py-1.5 px-3 text-[13px] font-medium rounded-[10px] transition-colors duration-150"
            style={{
              color: isActive ? '#1e293b' : 'rgba(30, 41, 59, 0.55)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
