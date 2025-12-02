import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';

interface Top100RegionProgressGridProps {
  lists: Top100ListProgress[];
  onListClick: (slug: string) => void;
}

function getRegionEmoji(slug: string) {
  switch (slug) {
    case 'global-top-100':
    case 'global':
      return '🌍';
    case 'gb-i-top-100':
    case 'gb-i':
      return '🇬🇧';
    case 'usa-top-100':
    case 'usa':
      return '🇺🇸';
    case 'europe-top-100':
    case 'europe':
      return '🇪🇺';
    default:
      return '⛳️';
  }
}

export function Top100RegionProgressGrid({
  lists,
  onListClick,
}: Top100RegionProgressGridProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Your Journey by Region</h3>
      <div className="space-y-2">
        {lists.map((list) => {
          const progressPercent = list.total > 0 ? (list.played / list.total) * 100 : 0;

          return (
            <button
              key={list.listSlug}
              type="button"
              onClick={() => onListClick(list.listSlug)}
              className="w-full rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-left shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <span>{getRegionEmoji(list.listSlug)}</span>
                    {list.listName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {list.played} / {list.total} courses played
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mt-2">
                <Progress
                  value={progressPercent}
                  className="h-1.5 bg-muted"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {(100 - progressPercent).toFixed(0)}% remaining to complete this list
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
