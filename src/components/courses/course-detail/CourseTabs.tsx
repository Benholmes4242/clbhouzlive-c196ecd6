import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type CourseTabId = 'about' | 'reviews' | 'media';

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
}

// Exact same tab trigger class used in CoursesContent.tsx and GolfersToFollowPage.tsx
const tabTriggerClass = "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]";

/**
 * Course detail tabs matching Explore/Courses/Golfers pages exactly.
 * Uses Radix UI Tabs with the same styling tokens.
 */
export function CourseTabs({ activeTab, onChange }: CourseTabsProps) {
  return (
    <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200/60">
      <Tabs value={activeTab} onValueChange={(v) => onChange(v as CourseTabId)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 px-0 py-0 gap-0">
          <TabsTrigger value="about" className={tabTriggerClass}>
            About
          </TabsTrigger>
          <TabsTrigger value="reviews" className={tabTriggerClass}>
            Reviews
          </TabsTrigger>
          <TabsTrigger value="media" className={tabTriggerClass}>
            Media
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}