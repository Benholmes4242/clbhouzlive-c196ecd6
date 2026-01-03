import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Flag, Map, ChevronRight } from 'lucide-react';
import { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';
import { RegionDrilldownSheet } from './RegionDrilldownSheet';

interface Top100RegionProgressGridProps {
  lists: Top100ListProgress[];
  isOwnProfile?: boolean;
  displayName?: string | null;
}

function getRegionIcon(slug: string) {
  const iconClass = "w-4 h-4";

  switch (slug) {
    case 'global-top-100':
    case 'global':
      return <Globe2 className={iconClass} />;
    case 'gb-i-top-100':
    case 'gb-i':
      return <Flag className={iconClass} />;
    case 'usa-top-100':
    case 'usa':
      return <Flag className={iconClass} />;
    case 'europe-top-100':
    case 'europe':
      return <Map className={iconClass} />;
    default:
      return <Map className={iconClass} />;
  }
}

// Short display names to avoid truncation (D1)
function getShortDisplayName(listName: string, slug: string): string {
  switch (slug) {
    case 'global':
      return 'World Top 100';
    case 'gb-i':
      return 'GB&I Top 100';
    case 'usa':
      return 'USA Top 100';
    case 'europe':
      return 'Europe Top 100';
    default:
      return listName;
  }
}

export function Top100RegionProgressGrid({
  lists,
  isOwnProfile = true,
  displayName: userDisplayName,
}: Top100RegionProgressGridProps) {
  const navigate = useNavigate();
  const [selectedList, setSelectedList] = useState<Top100ListProgress | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const label = isOwnProfile
    ? 'YOUR JOURNEY BY REGION'
    : `${userDisplayName?.toUpperCase() ?? 'THEIR'} JOURNEY BY REGION`;

  const handleListClick = (list: Top100ListProgress) => {
    setSelectedList(list);
    setIsSheetOpen(true);
  };

  const handleViewCourses = (filter: 'played' | 'unplayed') => {
    if (selectedList) {
      navigate(`/top100/${selectedList.listSlug}?filter=${filter}`);
    }
  };

  return (
    <>
      <section className="w-full">
        <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-3 px-2.5">
          {label}
        </h3>

        {/* Region cards - tappable for drilldown (D4) */}
        <div className="space-y-1.5">
          {lists.map((list) => {
            const progressPercent =
              list.total > 0 ? (list.played / list.total) * 100 : 0;
            const remainingPercent = Math.round(100 - progressPercent);
            const displayName = getShortDisplayName(list.listName, list.listSlug);

            return (
              <button
                key={list.listSlug}
                type="button"
                onClick={() => handleListClick(list)}
                className="w-full rounded-sq-sm border border-border/40 bg-card/60 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 group"
              >
                {/* Left side: icon (monochrome) + names */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-sq-sm bg-muted/40 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    {getRegionIcon(list.listSlug)}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    {/* Short name to avoid truncation (D1) */}
                    <span className="text-sm font-medium truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {list.played} / {list.total} courses played
                    </span>
                  </div>
                </div>

                {/* Right side: percentage above bar (D2) + increased contrast bar (D3) */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[100px]">
                  {/* Percentage - slightly smaller (item 7) */}
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {remainingPercent}% remaining
                  </span>

                  {/* Increased contrast progress bar (D3) */}
                  <div className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/40 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Chevron hint - lighter to feel like affordance (item 7) */}
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Region Drilldown Sheet (D4) */}
      <RegionDrilldownSheet
        list={selectedList}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onViewCourses={handleViewCourses}
      />
    </>
  );
}