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
};

export function TourHubHeader({ activeTab = 'overview' }: TourHubHeaderProps) {
  // All tabs are now full-bleed immersive — no in-page header banner
  // Each tab handles its own title/navigation internally
  return null;
}
