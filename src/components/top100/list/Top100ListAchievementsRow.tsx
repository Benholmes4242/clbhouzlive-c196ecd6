import React from 'react';
import { cn } from '@/lib/utils';

// List-specific milestones (10, 25, 50, 75)
const LIST_MILESTONES = [
  { threshold: 10, label: '10 Club' },
  { threshold: 25, label: '25 Club' },
  { threshold: 50, label: '50 Club' },
  { threshold: 75, label: '75 Club' },
] as const;

interface Top100ListAchievementsRowProps {
  listName: string;
  playedCount: number;
  totalCount: number;
}

export const Top100ListAchievementsRow: React.FC<Top100ListAchievementsRowProps> = ({
  listName,
  playedCount,
  totalCount,
}) => {
  // Calculate progress fraction (0-1) based on total count
  const progressFraction = Math.min(1, Math.max(0, playedCount / totalCount));
  const widthPercent = progressFraction * 100;

  // Find next milestone
  const nextMilestoneIndex = LIST_MILESTONES.findIndex(m => playedCount < m.threshold);

  return (
    <section className="px-5 pt-6">
      {/* Section header */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Achievements tied to this list
        </h2>
        <p className="text-xs text-muted-foreground">
          {playedCount} / {totalCount} courses played
        </p>
      </div>

      {/* Milestone tiles container */}
      <div className="relative">
        {/* Horizontal scroll row */}
        <div className="-mx-1 flex overflow-x-auto pb-2 scrollbar-hide">
          {LIST_MILESTONES.map((m, index) => {
            // Skip milestones exceeding list total (except for lists with < 75 courses)
            if (m.threshold > totalCount && totalCount >= 75) return null;
            
            const unlocked = playedCount >= m.threshold;
            const isNext = !unlocked && index === nextMilestoneIndex;
            const awayCount = m.threshold - playedCount;

            return (
              <div key={m.threshold} className="mx-1.5 w-[88px] flex-shrink-0 flex flex-col items-center">
                {/* Squircle badge */}
                <div
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-[18px] border-2 text-lg font-bold transition-all',
                    unlocked && 'border-emerald-500 text-emerald-600 bg-emerald-50',
                    !unlocked && 'border-slate-200 text-slate-400 bg-white'
                  )}
                >
                  <span>{m.threshold}</span>
                </div>

                {/* Label */}
                <div className="mt-2 text-[11px] font-medium text-foreground leading-tight text-center">
                  {m.label}
                </div>

                {/* Status */}
                <div className={cn(
                  'text-[10px] text-center',
                  unlocked && 'text-emerald-600 font-medium',
                  !unlocked && isNext && 'text-primary font-medium',
                  !unlocked && !isNext && 'text-muted-foreground'
                )}>
                  {unlocked ? 'Unlocked' : `${awayCount} away`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-3 relative">
          {/* Track */}
          <div className="h-1 w-full rounded-full bg-slate-100" />
          {/* Fill */}
          <div
            className="h-1 rounded-full bg-emerald-500 absolute top-0 left-0 transition-all duration-300"
            style={{ width: `${widthPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
};
