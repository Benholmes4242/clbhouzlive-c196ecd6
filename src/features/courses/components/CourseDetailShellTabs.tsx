import React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterChips } from '@/components/ui/FilterChips';

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
}

/**
 * CourseDetailShellTabs — canonical dark-fill pill row (FilterChips), matching
 * the Courses / Top 100 shell tabs.
 */
export const CourseDetailShellTabs: React.FC<CourseDetailShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation('courses');

  return (
    <div className="px-4 py-2 flex justify-center">
      <FilterChips
        options={TABS.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))}
        value={activeTab}
        onChange={(id) => onTabChange(id as CourseDetailTab)}
        ariaLabel={t('courseDetail.a11y.sections')}
      />
    </div>
  );
};

export default CourseDetailShellTabs;
