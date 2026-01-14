/**
 * TourHubHeader - Dynamic header that reflects the active section
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

/** Header content for each section */
const HEADER_CONTENT: Record<TourHubTab, { title: string; subtext: string }> = {
  overview: { 
    title: 'The Global Golf Season', 
    subtext: 'Every tour. Every event. Every moment that defines professional golf.' 
  },
  schedule: { title: 'Events', subtext: '' },
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
  
  return (
    <header className="pt-4 pb-3">
      {/* Top row: 9-dot icon (left) + Title */}
      <div className="flex items-center justify-between">
        {/* Left: 9-dot menu button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleMenuClick}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-all -ml-1"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
        >
          <NineDotsIcon className="text-slate-800" size={24} />
        </motion.button>
        
        {/* Center: Dynamic title based on active section */}
        {isOverview ? (
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex-1 text-[1.35rem] md:text-[1.5rem] font-semibold tracking-tight text-foreground text-center"
          >
            {title}
          </motion.h1>
        ) : isSchedule ? (
          <h1 className="flex-1 text-4xl font-bold font-league-spartan tracking-tight text-slate-800 text-center uppercase">
            {title}
          </h1>
        ) : (
          <h1 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
        )}
        
        {/* Right spacer for balance */}
        <div className="w-11" />
      </div>
      
      {/* Second row: Dynamic subtext */}
      {isOverview ? (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.05, ease: 'easeOut' }}
          className="mt-2 md:mt-3 text-sm md:text-base font-normal text-muted-foreground leading-relaxed text-center px-12"
        >
          {subtext}
        </motion.p>
      ) : (
        <p className="mt-2 text-center text-[13px] text-muted-foreground">
          {subtext}
        </p>
      )}
    </header>
  );
}
