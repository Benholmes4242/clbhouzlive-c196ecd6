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

// Region color config - subtle, premium tints
const REGION_COLORS: Record<string, { bg: string; fill: string; hover: string }> = {
  'global': {
    bg: 'bg-amber-500/8',
    fill: 'bg-amber-500/60',
    hover: 'hover:bg-amber-500/12'
  },
  'global-top-100': {
    bg: 'bg-amber-500/8',
    fill: 'bg-amber-500/60',
    hover: 'hover:bg-amber-500/12'
  },
  'gb-i': {
    bg: 'bg-blue-500/8',
    fill: 'bg-blue-500/60',
    hover: 'hover:bg-blue-500/12'
  },
  'gb-i-top-100': {
    bg: 'bg-blue-500/8',
    fill: 'bg-blue-500/60',
    hover: 'hover:bg-blue-500/12'
  },
  'usa': {
    bg: 'bg-red-500/8',
    fill: 'bg-red-500/60',
    hover: 'hover:bg-red-500/12'
  },
  'usa-top-100': {
    bg: 'bg-red-500/8',
    fill: 'bg-red-500/60',
    hover: 'hover:bg-red-500/12'
  },
  'europe': {
    bg: 'bg-emerald-500/8',
    fill: 'bg-emerald-500/60',
    hover: 'hover:bg-emerald-500/12'
  },
  'europe-top-100': {
    bg: 'bg-emerald-500/8',
    fill: 'bg-emerald-500/60',
    hover: 'hover:bg-emerald-500/12'
  },
};

const DEFAULT_REGION_COLOR = {
  bg: 'bg-muted/40',
  fill: 'bg-foreground/40',
  hover: 'hover:bg-muted/50'
};

function getRegionColors(slug: string) {
  return REGION_COLORS[slug] || DEFAULT_REGION_COLOR;
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
            const regionColors = getRegionColors(list.listSlug);

            return (
              <button
                key={list.listSlug}
                type="button"
                onClick={() => handleListClick(list)}
                className="w-full rounded-sq-sm border border-border/40 bg-card/60 px-3 py-2.5 text-left hover:bg-muted/30 transition-all duration-200 flex items-center justify-between gap-3 group"
              >
                {/* Left side: region-tinted icon container + names */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-sq-sm flex items-center justify-center flex-shrink-0 text-foreground/70 transition-all duration-200",
                      regionColors.bg,
                      regionColors.hover
                    )}
                  >
                    {getRegionIcon(list.listSlug)}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {list.played} / {list.total} courses played
                    </span>
                  </div>
                </div>

                {/* Right side: percentage above bar + region-colored progress fill */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[100px]">
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {remainingPercent}% remaining
                  </span>

                  {/* Progress bar with region-colored fill */}
                  <div className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-200 group-hover:opacity-90",
                        regionColors.fill
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Chevron hint */}
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