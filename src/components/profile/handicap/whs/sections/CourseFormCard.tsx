import React from 'react';
import { useCourseForm } from '@/lib/whs/hooks';

interface Props {
  connectionId: string;
  currentHandicap: number | null | undefined;
}

const MAX_BAR = 5; // strokes either side

export const CourseFormCard: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data, isLoading } = useCourseForm(connectionId, currentHandicap);

  if (currentHandicap === null || currentHandicap === undefined) return null;

  return (
    <section className="px-5 mb-6">
      <div className="mb-2">
        <h3 className="text-[16px] font-bold text-foreground">Course form</h3>
        <p className="text-[12px] text-muted-foreground">Where you play above your handicap</p>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted/50 rounded" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Play more rounds to see where you over-perform.
        </p>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 3).map((c) => {
            const better = c.delta < 0;
            const magnitude = Math.min(Math.abs(c.delta), MAX_BAR);
            const widthPct = (magnitude / MAX_BAR) * 50; // 50% half-line
            return (
              <div
                key={c.course_id}
                className="rounded-xl border p-3"
                style={{ borderColor: 'rgba(15,23,42,0.08)' }}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-[15px] font-semibold text-foreground truncate">
                    {c.course_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0 ml-2">
                    {c.rounds_played} {c.rounds_played === 1 ? 'round' : 'rounds'}
                  </p>
                </div>

                {/* Bar */}
                <div className="relative h-2 mb-2">
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px"
                    style={{ background: 'rgba(15,23,42,0.10)' }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      left: '50%',
                      background: 'rgba(15,23,42,0.30)',
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 rounded-full"
                    style={{
                      ...(better
                        ? { right: '50%', width: `${widthPct}%` }
                        : { left: '50%', width: `${widthPct}%` }),
                      background: better ? '#10B981' : '#DC2626',
                      opacity: 0.8,
                    }}
                  />
                </div>

                <p className="text-[12px] text-muted-foreground">
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: better ? '#059669' : '#B91C1C' }}
                  >
                    {Math.abs(c.delta).toFixed(1)} strokes {better ? 'better' : 'worse'}
                  </span>{' '}
                  than your handicap
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CourseFormCard;
