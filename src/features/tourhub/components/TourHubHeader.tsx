/**
 * TourHubHeader - Clean header with 9-dot menu trigger on the left
 * Premium intro line instead of section label
 */

import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { NineDotsIcon } from './NineDotsIcon';
import type { TourHubTab } from './TourHubTabs';

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
      {/* Top row: 9-dot icon (left) + Title (center) */}
      <div className="flex items-center justify-between">
        {/* Left: 9-dot menu button - no visible container */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleMenuClick}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-all -ml-1"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
        >
          <NineDotsIcon className="text-foreground/60" size={20} />
        </motion.button>
        
        {/* Center: Title - Premium rebrand */}
        <h1 className="text-lg font-bold uppercase tracking-[-0.02em] text-foreground">
          The Tour
        </h1>
        
        {/* Right spacer for balance */}
        <div className="w-11" />
      </div>
      
      {/* Second row: Clean value prop */}
      <p className="mt-2 text-center text-[13px] text-muted-foreground">
        Professional Golf Rankings, Leaderboards & Live Coverage
      </p>
    </header>
  );
}
