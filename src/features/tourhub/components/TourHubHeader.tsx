/**
 * TourHubHeader - Section title header for tabs
 * Dark theme compatible with cinematic design system
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TourHubTab } from './TourHubTabs';

interface TourHubHeaderProps {
  activeTab?: TourHubTab;
  onMenuOpen?: () => void;
}

/** Header content for each section */
const HEADER_CONTENT: Record<TourHubTab, { title: string; subtext: string }> = {
  overview: { title: '', subtext: '' },
  schedule: { title: 'Schedule', subtext: '2025 Season' },
  players: { title: 'Players', subtext: 'Tour Roster' },
  leaderboards: { title: 'Leaders', subtext: 'Season Rankings' },
  summary: { title: 'Summary', subtext: 'Tournament Recap' },
  'tee-times': { title: 'Tee Times', subtext: 'Starting Times' },
  'hole-stats': { title: 'Holes', subtext: 'Course Analytics' },
};

// Dark tabs that use white text
const DARK_TABS = ['overview', 'schedule', 'players', 'leaderboards'];

export function TourHubHeader({ activeTab = 'overview' }: TourHubHeaderProps) {
  const { title, subtext } = HEADER_CONTENT[activeTab] || HEADER_CONTENT.overview;
  const isDarkTab = DARK_TABS.includes(activeTab);
  
  // Overview tab: No in-page header
  if (activeTab === 'overview') {
    return null;
  }
  
  return (
    <header className="pt-6 pb-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 
          className={`text-2xl md:text-3xl font-bold tracking-tight ${
            isDarkTab ? 'text-white' : 'text-foreground'
          }`}
        >
          {title}
        </h1>
        {subtext && (
          <p className={`mt-1 text-sm ${
            isDarkTab ? 'text-white/60' : 'text-muted-foreground'
          }`}>
            {subtext}
          </p>
        )}
      </div>
    </header>
  );
}
