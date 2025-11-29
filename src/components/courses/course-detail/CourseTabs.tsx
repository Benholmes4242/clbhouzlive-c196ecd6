import React from 'react';
import { SegmentedTabs, SegmentedTabOption } from '@/components/ui/SegmentedTabs';

export type CourseTabId = 'about' | 'reviews' | 'media';

const COURSE_TAB_OPTIONS: SegmentedTabOption[] = [
  { value: 'about', label: 'About' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'media', label: 'Media' },
];

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
}

export function CourseTabs({ activeTab, onChange }: CourseTabsProps) {
  return (
    <div className="px-4 pt-3 pb-3 bg-slate-50">
      <SegmentedTabs
        options={COURSE_TAB_OPTIONS}
        value={activeTab}
        onChange={onChange as (value: string) => void}
      />
    </div>
  );
}
