import React from 'react';
import SegmentedControl from '@/components/discover/SegmentedControl';

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
 * CoursesShellTabs — canonical pill tab strip shared with Discover.
 * Light variant, centered, no bottom divider (the parent owns the seam).
 */
export const CoursesShellTabs: React.FC<CoursesShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => (
  <SegmentedControl
    tabs={TABS}
    activeTab={activeTab}
    onTabChange={(id) => onTabChange(id as CoursesTab)}
    variant="light"
    align="center"
    hideBorder
    ariaLabel="Courses Sections"
  />
);

export default CoursesShellTabs;
