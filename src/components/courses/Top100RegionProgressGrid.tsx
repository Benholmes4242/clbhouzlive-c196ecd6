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
    <section className="mt-6 w-full">
      <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-2 px-1">
        {label}
      </h3>

      <div className="space-y-2">
        {lists.map((list) => {
          const progressPercent =
            list.total > 0 ? (list.played / list.total) * 100 : 0;

          return (
            <button
              key={list.listSlug}
              type="button"
              onClick={() => onListClick(list.listSlug)}
              className="w-full rounded-2xl border border-border/70 bg-card/90 px-4 py-3 text-left shadow-xs hover:shadow-md hover:bg-muted/40 transition-shadow transition-colors flex items-center justify-between gap-3"
            >
              {/* Left side: icon + names */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
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

              {/* Right side: remaining + bar */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[120px]">
                <span className="text-[11px] text-muted-foreground">
                  {(100 - progressPercent).toFixed(0)}% remaining
                </span>

                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/70 transition-all"
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
