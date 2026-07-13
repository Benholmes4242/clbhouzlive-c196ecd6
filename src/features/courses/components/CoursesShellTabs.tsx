import React from 'react';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';

type CoursesTab = 'explore' | 'top100' | 'discover';

const TABS = [
  { id: 'discover' as const, label: 'Discover' },
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
 */
export const CoursesShellTabs: React.FC<CoursesShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => (
  <div style={{ background: '#F8FAFC' }}>
    <UnderlineTabs
      options={TABS}
      value={activeTab}
      onChange={onTabChange}
      size="md"
      align="center"
      underlineColor="#0A0E14"
      ariaLabel="Courses Sections"
    />
  </div>
);

export default CoursesShellTabs;
