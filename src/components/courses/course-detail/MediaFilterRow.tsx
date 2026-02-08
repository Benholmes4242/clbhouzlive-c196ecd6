import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type MediaFilterMode = 'most_recent' | 'photos' | 'videos' | 'friends' | 'mine';

interface MediaFilterRowProps {
  filterMode: MediaFilterMode;
  onFilterChange: (mode: MediaFilterMode) => void;
  hasFriends?: boolean;
  hasUserMedia?: boolean;
}

// Exact same tab trigger class used in CourseTabs.tsx
const tabTriggerClass = "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]";

export const MediaFilterRow: React.FC<MediaFilterRowProps> = ({
  filterMode,
  onFilterChange,
  hasFriends = false,
  hasUserMedia = false,
}) => {
  // Calculate number of tabs for grid
  let tabCount = 3; // most_recent, photos, videos
  if (hasFriends) tabCount++;
  if (hasUserMedia) tabCount++;

  return (
    <div className="px-4 py-2 bg-card border-b border-border/60">
      <Tabs value={filterMode} onValueChange={(v) => onFilterChange(v as MediaFilterMode)} className="w-full">
        <TabsList 
          className="bg-transparent border-0 px-0 py-0 gap-0 w-full flex justify-center"
        >
          <TabsTrigger value="most_recent" className={tabTriggerClass}>
            Most recent
          </TabsTrigger>
          <TabsTrigger value="photos" className={tabTriggerClass}>
            Photos
          </TabsTrigger>
          <TabsTrigger value="videos" className={tabTriggerClass}>
            Videos
          </TabsTrigger>
          {hasFriends && (
            <TabsTrigger value="friends" className={tabTriggerClass}>
              From friends
            </TabsTrigger>
          )}
          {hasUserMedia && (
            <TabsTrigger value="mine" className={tabTriggerClass}>
              From you
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
};
