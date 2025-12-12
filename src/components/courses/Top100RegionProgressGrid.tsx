import React from 'react';
import { Globe2, Flag, Map } from 'lucide-react';
import { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';

interface Top100RegionProgressGridProps {
  lists: Top100ListProgress[];
  onListClick: (slug: string) => void;
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

export function Top100RegionProgressGrid({
  lists,
  onListClick,
  isOwnProfile = true,
  displayName,
}: Top100RegionProgressGridProps) {
  const label = isOwnProfile
    ? 'YOUR JOURNEY BY REGION'
    : `${displayName?.toUpperCase() ?? 'THEIR'} JOURNEY BY REGION`;

  return (
    <section className="w-full">
      <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-3 px-2.5">
        {label}
      </h3>

      {/* Reduced row height, calm progress bars, icons monochrome */}
      <div className="space-y-1.5">
        {lists.map((list) => {
          const progressPercent =
            list.total > 0 ? (list.played / list.total) * 100 : 0;
          const remainingPercent = 100 - progressPercent;

          return (
            <button
              key={list.listSlug}
              type="button"
              onClick={() => onListClick(list.listSlug)}
              className="w-full rounded-sq-sm border border-border/40 bg-card/60 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors flex items-center justify-between gap-3"
            >
              {/* Left side: icon (monochrome) + names */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-sq-sm bg-muted/40 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                  {getRegionIcon(list.listSlug)}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {list.listName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {list.played} / {list.total} courses played
                  </span>
                </div>
              </div>

              {/* Right side: remaining + bar - calmer, less saturated, aligned left */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[100px]">
                <span className="text-[10px] text-muted-foreground/70">
                  {remainingPercent.toFixed(0)}% remaining
                </span>

                {/* Quieter, less saturated progress bar - aligned left */}
                <div className="w-full h-1 rounded-full bg-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-muted-foreground/30 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
