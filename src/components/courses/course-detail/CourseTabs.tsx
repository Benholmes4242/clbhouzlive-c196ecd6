import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type CourseTabId = 'about' | 'reviews' | 'media';

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
  reviewCount?: number;
  mediaCount?: number;
}

// Enhanced tab trigger with thicker orange indicator (matches app theme)
const tabTriggerClass = cn(
  "relative px-4 py-3 text-sm font-medium transition-colors",
  "bg-transparent border-0 shadow-none rounded-none",
  "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
  "data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-500",
  "hover:text-gray-700",
  // Active indicator - thicker orange underline
  "after:absolute after:bottom-0 after:left-0 after:right-0",
  "after:h-[3px] after:rounded-full after:transition-all after:duration-200",
  "data-[state=active]:after:bg-[hsl(var(--tab-orange))] data-[state=inactive]:after:bg-transparent"
);

/**
 * Course detail tabs with premium styling
 * Features count badges and bold green active indicator
 */
export function CourseTabs({ activeTab, onChange, reviewCount, mediaCount }: CourseTabsProps) {
  return (
    <div className="px-4 pt-3 pb-0 bg-slate-50 border-b border-slate-200/60">
      <Tabs value={activeTab} onValueChange={(v) => onChange(v as CourseTabId)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 px-0 py-0 gap-0 h-auto">
          <TabsTrigger value="about" className={tabTriggerClass}>
            About
          </TabsTrigger>
          <TabsTrigger value="reviews" className={tabTriggerClass}>
            <span className="flex items-center gap-1.5">
              Reviews
              {reviewCount !== undefined && reviewCount > 0 && (
                <span className="text-xs text-gray-400">({reviewCount})</span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="media" className={tabTriggerClass}>
            <span className="flex items-center gap-1.5">
              Media
              {mediaCount !== undefined && mediaCount > 0 && (
                <span className="text-xs text-gray-400">({mediaCount})</span>
              )}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}