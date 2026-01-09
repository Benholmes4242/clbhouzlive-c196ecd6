/**
 * TourHubHeader - Clean header with 9-dot menu trigger
 * Shows title and optional current section label
 */

import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { NineDotsIcon } from './NineDotsIcon';
import type { TourHubTab } from './TourHubTabs';

// Map tab values to display labels
const TAB_LABELS: Record<TourHubTab, string> = {
  'overview': 'Overview',
  'schedule': 'Schedule',
  'players': 'Players',
  'player-stats': 'Stats',
  'leaderboards': 'Leaders',
  'summary': 'Summary',
  'tee-times': 'Tee Times',
  'hole-stats': 'Holes',
};

interface TourHubHeaderProps {
  activeTab?: TourHubTab;
  onMenuOpen: () => void;
}

export function TourHubHeader({ activeTab = 'overview', onMenuOpen }: TourHubHeaderProps) {
  const handleMenuClick = () => {
    haptic('light');
    onMenuOpen();
  };
  
  return (
    <header className="pt-4 pb-3">
      {/* Top row: Title + 9-dot icon */}
      <div className="flex items-center justify-between">
        {/* Left spacer for balance */}
        <div className="w-10" />
        
        {/* Center: Title */}
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Tour Hub
        </h1>
        
        {/* Right: 9-dot menu button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleMenuClick}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
          style={{
            background: 'rgba(0, 0, 0, 0.04)',
          }}
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
        >
          <NineDotsIcon className="text-foreground/70" size={18} />
        </motion.button>
      </div>
      
      {/* Second row: Current section breadcrumb */}
      <div className="mt-2 text-center">
        <span 
          className="text-sm font-medium"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {TAB_LABELS[activeTab]}
        </span>
      </div>
    </header>
  );
}
