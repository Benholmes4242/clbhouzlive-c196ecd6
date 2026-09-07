import { AppHeader } from '@/components/chrome/AppHeader';

/**
 * The Discover band is now a THIN CALL of the shared header
 * (`src/components/chrome/AppHeader.tsx`) — see BRIEF_TOUR_HEADER_CORRECTION,
 * Correction 1. Discover passes no `left`, so it gets the clbhouz mark; Tour
 * passes the glass burger. There is no second implementation to drift.
 */

export type DiscoverTab = 'scores' | 'news' | 'gallery';

const TABS = [
  { id: 'scores', label: 'SCORES' },
  { id: 'news', label: 'NEWS' },
  { id: 'gallery', label: 'WATCH' },
] as const;

export function DiscoverHeader({ active, onChange }: { active: DiscoverTab; onChange: (tab: DiscoverTab) => void }) {
  return (
    <AppHeader
      tabs={TABS}
      active={active}
      onTabChange={(id) => onChange(id as DiscoverTab)}
      tabsAriaLabel="Discover sections"
      inset="self"
      heightVar="--discover-header-h"
    />
  );
}
