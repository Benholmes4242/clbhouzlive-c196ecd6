import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Top100ListSummary } from '@/hooks/useTop100ListSummaries';

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

      {/* Title */}
      <div className="absolute left-4 right-4 top-4 sm:top-5">
        <h2 className="truncate whitespace-nowrap text-[19px] sm:text-[20px] font-semibold tracking-tight text-white">
          {list.short_label || list.name}
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

        {/* #1 course chip + View courses button */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {hero && (
            <div className="inline-flex max-w-[60%] items-center rounded-2xl bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur">
              <span className="truncate">
                #{hero.rank_in_list} {hero.name}
              </span>
            </div>
          )}

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
