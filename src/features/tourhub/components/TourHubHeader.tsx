/**
 * TourHubHeader - Section title header for non-overview tabs
 * Overview tab has no in-page header (menu is in global CompactHeader)
 */

import React from 'react';
import type { TourHubTab } from './TourHubTabs';

interface TourHubHeaderProps {
  activeTab?: TourHubTab;
  onMenuOpen?: () => void; // Keep for backward compatibility but unused
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

export function TourHubHeader({ activeTab = 'overview' }: TourHubHeaderProps) {
  const { title, subtext } = HEADER_CONTENT[activeTab] || HEADER_CONTENT.overview;
  const isOverview = activeTab === 'overview';
  const isSchedule = activeTab === 'schedule';
  
  // Overview tab: No in-page header - menu icon is now in global CompactHeader
  if (isOverview) {
    return null;
  }
  
  return (
    <header className="pt-4 pb-3 px-4">
      {/* Title centered */}
      <div className="flex items-center justify-center">
        {isSchedule ? (
          <h1 
            className="font-extrabold text-foreground text-center"
            style={{ 
              fontSize: '28px',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
            }}
          >
            {title}
          </h1>
        ) : (
          <h1 className="text-lg font-bold tracking-[-0.02em] text-foreground text-center">
            {title}
          </h1>
        )}
      </div>
      
      {/* Second row: Dynamic subtext or Schedule divider */}
      {isSchedule ? (
        <div className="flex justify-center mt-4 mb-2">
          <div className="w-[80vw] border-t border-border" />
        </div>
      ) : subtext ? (
        <p className="mt-2 text-center text-[13px] text-muted-foreground">
          {subtext}
        </p>
      ) : null}
    </header>
  );
}
