import React from 'react';
import { SegmentedControl, SegmentOption } from '@/components/ui/SegmentedControl';

export type CourseTabId = 'about' | 'reviews' | 'media';

const COURSE_TABS: SegmentOption<CourseTabId>[] = [
  { id: 'about', label: 'About' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'media', label: 'Media' },
];

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
}

export function CourseTabs({ activeTab, onChange }: CourseTabsProps) {
  return (
    <div className="px-4 pt-3 pb-3 bg-slate-50">
      <SegmentedControl
        options={COURSE_TABS}
        value={activeTab}
        onChange={onChange}
      />
    </div>
  );
}
