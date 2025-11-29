import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type CourseTabId = 'about' | 'reviews' | 'media';

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
}

export function CourseTabs({ activeTab, onChange }: CourseTabsProps) {
  return (
    <div className="px-4 pt-3 pb-3 bg-slate-50">
      <Tabs value={activeTab} onValueChange={onChange as any}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/70 border border-border/60 px-2 py-[3px]">
          <TabsTrigger 
            value="about"
            className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
          >
            About
          </TabsTrigger>
          <TabsTrigger 
            value="reviews"
            className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
          >
            Reviews
          </TabsTrigger>
          <TabsTrigger 
            value="media"
            className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
          >
            Media
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
