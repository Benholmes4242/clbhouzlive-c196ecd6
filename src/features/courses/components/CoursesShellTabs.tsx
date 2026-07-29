import React from 'react';
import { FilterChips } from '@/components/ui/FilterChips';

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
 * CoursesShellTabs — canonical dark-fill pill row (FilterChips), matching the
 * Top 100 region pills. Centered, no bottom divider (the parent owns the seam).
 */
export const CoursesShellTabs: React.FC<CoursesShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => (
  <div className="px-4 py-1 flex justify-center">
    <FilterChips
      options={TABS}
      value={activeTab}
      onChange={(id) => onTabChange(id as CoursesTab)}
      ariaLabel="Courses Sections"
    />
  </div>
);

export default CoursesShellTabs;
