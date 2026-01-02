import React from 'react';
import { UnderlineTabs, UnderlineTabOption } from '@/components/ui/UnderlineTabs';

export type CourseTabId = 'about' | 'reviews' | 'media';

const COURSE_TAB_OPTIONS: UnderlineTabOption[] = [
  { value: 'about', label: 'About' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'media', label: 'Media' },
];

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
}

/**
 * Course detail tabs using underline style matching Explore/Courses tabs.
 * - Active tab: darker text + thin orange underline
 * - Inactive: grey text, no background
 * - Animated sliding underline
 */
export function CourseTabs({ activeTab, onChange }: CourseTabsProps) {
  return (
    <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200/60">
      <UnderlineTabs
        options={COURSE_TAB_OPTIONS}
        value={activeTab}
        onChange={onChange as (value: string) => void}
        className="justify-center"
      />
    </div>
  );
}