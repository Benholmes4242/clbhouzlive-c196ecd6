/**
 * TourHubHeader - Minimal header with 9-dot menu button only for overview
 * Other tabs show their section title
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

/** Header content for each section - overview has no title/subtext */
const HEADER_CONTENT: Record<TourHubTab, { title: string; subtext: string }> = {
  overview: { title: '', subtext: '' },
  schedule: { title: 'Schedule', subtext: '' },
  players: { title: 'Players', subtext: 'Tour roster' },
  leaderboards: { title: 'Leaders', subtext: 'Season rankings' },
  summary: { title: 'Summary', subtext: 'Tournament recap' },
  'tee-times': { title: 'Tee Times', subtext: 'Starting times' },
  'hole-stats': { title: 'Holes', subtext: 'Course analytics' },
};

export function TourHubHeader({ activeTab = 'overview', onMenuOpen }: TourHubHeaderProps) {
  const handleMenuClick = () => {
    haptic('light');
    onMenuOpen();
  };

  const { title, subtext } = HEADER_CONTENT[activeTab] || HEADER_CONTENT.overview;
  const isOverview = activeTab === 'overview';
  const isSchedule = activeTab === 'schedule';
  
  // For overview: minimal header with just the 9-dot menu button on left
  if (isOverview) {
    return (
      <header className="pt-3 pb-2">
        <div className="flex items-center">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleMenuClick}
            className="w-11 h-11 flex items-center justify-center rounded-xl transition-all -ml-1"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
          >
            <NineDotsIcon className="text-slate-800" size={28} />
          </motion.button>
        </div>
      </header>
    );
  }
  
  return (
    <header className="pt-4 pb-3">
      {/* Top row: 9-dot icon (left) + Title */}
      <div className="flex items-end justify-between">
        {/* Left: 9-dot menu button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleMenuClick}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-all -ml-1"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
        >
          <NineDotsIcon className="text-slate-800" size={28} />
        </motion.button>
        
        {/* Center: Dynamic title based on active section */}
        {isSchedule ? (
          <h1 
            className="flex-1 font-extrabold text-slate-800 text-center"
            style={{ 
              fontSize: '28px',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
            }}
          >
            {title}
          </h1>
        ) : (
          <h1 className="flex-1 text-lg font-bold tracking-[-0.02em] text-foreground text-center">
            {title}
          </h1>
        )}
        
        {/* Right spacer for balance */}
        <div className="w-11" />
      </div>
      
      {/* Second row: Dynamic subtext or Schedule divider */}
      {isSchedule ? (
        <div className="flex justify-center mt-4 mb-2">
          <div className="w-[80vw] border-t border-slate-800/20" />
        </div>
      ) : subtext ? (
        <p className="mt-2 text-center text-[13px] text-muted-foreground">
          {subtext}
        </p>
      ) : null}
    </header>
  );
}
