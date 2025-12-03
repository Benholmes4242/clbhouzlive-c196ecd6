import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CourseMover } from '@/hooks/useTop100CourseMovers';

interface Props {
  items: CourseMover[];
  timeRange: string;
}

export function Top100CourseMoversStrip({ items, timeRange }: Props) {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  // Filter to only show items with positive movement
  const movers = items.filter(
    (c) => c.rating_delta > 0.1 || c.plays_delta >= 3
  );

  if (movers.length === 0) return null;

  const label =
    timeRange === 'week'
      ? 'Biggest movers this week'
      : timeRange === 'month'
      ? 'Biggest movers this month'
      : 'Courses on the move';

  return (
    <section className="mt-1 md:mt-2">
      <div className="flex items-center justify-between mb-2 px-4 sm:px-0">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </h3>
      </div>

      <div className="-mx-4 sm:mx-0">
        <div className="flex gap-3 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide snap-x snap-mandatory">
          {movers.map((c) => {
            const showRating = c.rating_delta >= 0.1;
            const showPlays = c.plays_delta >= 3;

            return (
              <button
                key={c.course_id}
                type="button"
                onClick={() => navigate(`/courses/${c.course_id}`)}
                className="snap-start flex-shrink-0 w-44 md:w-52 rounded-2xl border border-border/70 bg-card/90 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                <p className="text-[13px] font-medium truncate">
                  {c.course_name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.sub_country && `${c.sub_country}, `}{c.country}
                </p>

                <div className="mt-1.5 flex flex-col gap-0.5 text-[11px]">
                  {showRating && (
                    <div className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>
                        Rating up{' '}
                        <span className="font-semibold">
                          +{c.rating_delta.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  )}
                  {showPlays && (
                    <div className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      <span>
                        Plays up{' '}
                        <span className="font-semibold">
                          +{c.plays_delta}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
