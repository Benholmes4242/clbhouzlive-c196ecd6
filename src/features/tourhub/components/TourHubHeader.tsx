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
    <header className="pt-4 pb-4">
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
        
        {/* Center: Title */}
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Tour Hub
        </h1>
        
        {/* Right spacer for balance */}
        <div className="w-11" />
      </div>
      
      {/* Second row: Premium intro line */}
      <div className="mt-3 text-center px-4">
        <p 
          className="text-[13px] leading-relaxed max-w-[320px] mx-auto"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Your home for pro golf: leaderboards, stats, schedules, and the latest storylines.
        </p>
      </div>
    </header>
  );
}
