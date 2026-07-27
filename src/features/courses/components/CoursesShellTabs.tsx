import React from 'react';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';

type CoursesTab = 'explore' | 'top100';

const TABS = [
  { id: 'explore' as const, label: 'Courses' },
  { id: 'top100' as const, label: 'Top 100' },
];

interface CoursesShellTabsProps {
  activeTab: CoursesTab;
  onTabChange: (tab: CoursesTab) => void;
}

/**
 * CoursesShellTabs — thin wrapper around the canonical UnderlineTabs primitive
 * using an INK underline (per design: no amber on Courses shell tabs).
 *
 * Discover used to be the first tab here; it now lives in the bottom nav at
 * /explore, so this surface is purely courses.
 */
export const CoursesShellTabs: React.FC<CoursesShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => (
  <UnderlineTabs
    options={TABS}
    value={activeTab}
    onChange={onTabChange}
    size="md"
    align="center"
    underlineColor="#15171F"
    ariaLabel="Courses Sections"
  />
);

export default CoursesShellTabs;
