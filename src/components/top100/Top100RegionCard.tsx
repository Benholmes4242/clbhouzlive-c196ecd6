import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';
import { Top100RankBadge } from './Top100RankBadge';

type Top100RegionCardProps = {
  list: Top100ListSummary;
  onClick?: () => void;
};

export const Top100RegionCard: React.FC<Top100RegionCardProps> = ({
  list,
  onClick,
}) => {
  const total = list.total_courses ?? 0;
  const rated = list.played_count ?? 0;
  const completion = total > 0 ? Math.min(100, Math.round((rated / total) * 100)) : 0;
  const hero = list.hero_course;
  const topRank = hero?.rank_in_list ?? null;
  const listSlug = list.slug as 'global' | 'gb-i' | 'usa' | 'europe';

  // Map short labels to full display names
  const getDisplayLabel = (shortLabel: string) => {
    if (shortLabel === 'GB&I') return 'Great Britain & Ireland';
    if (shortLabel === 'Europe') return 'Continental Europe';
    return shortLabel;
  };

  const displayLabel = getDisplayLabel(list.short_label || list.name);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[28px]',
        'bg-slate-900 text-white shadow-md',
        'transition-transform duration-200 ease-out',
        'hover:scale-[1.02] hover:shadow-xl',
        'active:scale-[0.99]',
        'h-[280px] sm:h-[300px] cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Background image */}
      {hero?.cover_image_url ? (
        <>
          <img
            src={hero.cover_image_url}
            alt={hero.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/0" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      {/* Top-right rank badge */}
      {topRank && (
        <div className="absolute right-4 top-4 z-10">
          <Top100RankBadge listSlug={listSlug} rank={topRank} />
        </div>
      )}

      {/* Title */}
      <div className="absolute left-4 right-4 top-4 sm:top-5">
        <h2 className="truncate whitespace-nowrap text-[19px] sm:text-[20px] font-semibold tracking-tight text-white">
          {displayLabel}
        </h2>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 px-4 pb-4 pt-20">
        {/* Fraction + % */}
        <div className="flex items-center justify-between text-xs">
          <span>
            Rated{" "}
            <span className="font-semibold">{rated}</span>{" "}
            of {total} courses
          </span>
          <span className="font-semibold text-amber-300">
            {completion}% complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-amber-400 transition-[width] duration-500 ease-out"
            style={{ width: `${completion}%` }}
          />
        </div>

        {/* View courses button */}
        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-2xl px-4 py-1.5 text-xs font-medium bg-white/95 text-slate-900 hover:bg-white border-none"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View courses
          </Button>
        </div>
      </div>
    </div>
  );
};
