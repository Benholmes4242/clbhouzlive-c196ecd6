import React from 'react';
import { useTranslation } from 'react-i18next';
import { RailChips } from '@/components/ui/RailChips';

type CourseDetailTab = 'course' | 'you' | 'legends' | 'reviews' | 'media';

const TABS: { id: CourseDetailTab; labelKey: string }[] = [
  { id: 'course',  labelKey: 'courseDetail.tabs.course' },
  { id: 'you',     labelKey: 'courseDetail.tabs.you' },
  { id: 'legends', labelKey: 'courseDetail.tabs.legends' },
  { id: 'reviews', labelKey: 'courseDetail.tabs.reviews' },
  { id: 'media',   labelKey: 'courseDetail.tabs.media' },
];

interface CourseDetailShellTabsProps {
  activeTab: CourseDetailTab;
  onTabChange: (tab: CourseDetailTab) => void;
  docked?: boolean;
}

/**
 * CourseDetailShellTabs — canonical chip row (RailChips), matching
 * the Courses / Top 100 shell tabs.
 * The chips share the full run between the gutters rather than
 * sitting centred.
 * G2A: IslandDock owns the docked copy's gutter, glass and visibility;
 * GolfClubView supplies the same URL/analytics handler to both copies.
 */
export const CourseDetailShellTabs: React.FC<CourseDetailShellTabsProps> = ({
  activeTab,
  onTabChange,
  docked = false,
}) => {
  const { t } = useTranslation('courses');

  return (
    <div className={docked ? undefined : 'px-4 py-2'} data-course-controls={docked ? 'docked' : 'in-place'}>
      <RailChips
        options={TABS.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))}
        value={activeTab}
        onChange={(id) => onTabChange(id as CourseDetailTab)}
        ariaLabel={t('courseDetail.a11y.sections')}
        distribute
      />
    </div>
  );
};

export default CourseDetailShellTabs;
