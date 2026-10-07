import React from 'react';
import { useTranslation } from 'react-i18next';
import { RailChips } from '@/components/ui/RailChips';

export type CourseTabId = 'course' | 'you' | 'legends' | 'reviews' | 'media';

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
  reviewCount?: number;
  mediaCount?: number;
}

const TABS: { id: CourseTabId; labelKey: string }[] = [
  { id: 'course',  labelKey: 'courseDetail.tabs.course' },
  { id: 'you',     labelKey: 'courseDetail.tabs.you' },
  { id: 'legends', labelKey: 'courseDetail.tabs.legends' },
  { id: 'reviews', labelKey: 'courseDetail.tabs.reviews' },
  { id: 'media',   labelKey: 'courseDetail.tabs.media' },
];

/**
 * CourseTabs — Modal tab bar for the course detail sheet.
 * Canonical chip row (RailChips), matching the Courses shell tabs.
 * The chips share the full run between the gutters rather than
 * sitting centred.
 */
export function CourseTabs({ activeTab, onChange, reviewCount, mediaCount }: CourseTabsProps) {
  const { t } = useTranslation('courses');

  const getLabel = (tab: { id: CourseTabId; labelKey: string }) => {
    const base = t(tab.labelKey);
    if (tab.id === 'reviews' && reviewCount) return `${base} (${reviewCount})`;
    if (tab.id === 'media' && mediaCount) return `${base} (${mediaCount})`;
    return base;
  };

  return (
    <div
      className="px-4 py-2"
      style={{ background: 'hsl(var(--background))' }}
    >
      <RailChips
        options={TABS.map((tab) => ({ id: tab.id, label: getLabel(tab) }))}
        value={activeTab}
        onChange={(id) => onChange(id as CourseTabId)}
        ariaLabel={t('courseDetail.a11y.sections')}
        distribute
      />
    </div>
  );
}
