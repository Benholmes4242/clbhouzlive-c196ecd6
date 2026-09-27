import React from 'react';
import { RailChips } from '@/components/ui/RailChips';

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
 * CoursesShellTabs — canonical chip row (RailChips), matching the
 * Top 100 region pills. Centered, no bottom divider (the parent owns the seam).
 */
export const CoursesShellTabs: React.FC<CoursesShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => (
  <div className="px-4 py-1 flex justify-center">
    <RailChips
      align="center-when-fit"
      options={TABS}
      value={activeTab}
      onChange={(id) => onTabChange(id as CoursesTab)}
      ariaLabel="Courses Sections"
    />
  </div>
);

export default CoursesShellTabs;
