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
 * Top 100 region pills. The two chips share the full run between the
 * gutters; no bottom divider (the parent owns the seam).
 * The 8px lead-in below the hero is CourseDetailShellTabs' `py-2`, so the
 * pill row clears its photograph by the same distance on both pages.
 */
export const CoursesShellTabs: React.FC<CoursesShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => (
  <div className="px-4 py-2">
    <RailChips
      options={TABS}
      value={activeTab}
      onChange={(id) => onTabChange(id as CoursesTab)}
      ariaLabel="Courses Sections"
      distribute
    />
  </div>
);

export default CoursesShellTabs;
