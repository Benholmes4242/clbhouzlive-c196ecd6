import React from 'react';
import { TOP100_LIST_MILESTONES } from '@/config/top100ListMilestones';
import { cn } from '@/lib/utils';

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
  const milestones = TOP100_LIST_MILESTONES;
  const nextIndex = milestones.findIndex(m => playedCount < m.threshold);
  const maxThreshold = Math.min(milestones[milestones.length - 1]?.threshold ?? 100, totalCount);

  return (
    <section className="px-5 pt-4">
      {/* Section title */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Achievements tied to this list
        </h2>
        <p className="text-xs text-muted-foreground">
          {playedCount} / {totalCount} courses played
        </p>
      </div>

      {/* Horizontal scroll row */}
      <div className="-mx-1 flex overflow-x-auto pb-2 scrollbar-hide">
        {milestones.map((m, index) => {
          // Skip milestones that exceed this list's total
          if (m.threshold > totalCount && m.threshold !== 100) return null;
          
          const unlocked = playedCount >= m.threshold;
          const isNext = !unlocked && index === nextIndex;
          const isListComplete = m.threshold >= totalCount;
          const completed = unlocked && isListComplete;

          let status: string;
          if (completed) status = 'List completed';
          else if (unlocked) status = 'Unlocked';
          else if (isNext) status = `${m.threshold - playedCount} away`;
          else status = `${m.threshold} courses`;

          // Badge label
          const badgeLabel = isListComplete 
            ? `${listName} complete` 
            : `${m.threshold} Club`;

          return (
            <div key={m.threshold} className="mx-1.5 w-[88px] flex-shrink-0 flex flex-col items-center">
              {/* Squircle badge */}
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-[18px] border-2 text-lg font-bold transition-all',
                  completed && 'border-amber-500 text-amber-600 bg-amber-50',
                  unlocked && !completed && 'border-emerald-500 text-emerald-600 bg-emerald-50',
                  !unlocked && 'border-slate-200 text-slate-400 bg-white'
                )}
              >
                <span>{m.threshold}</span>
              </div>

              {/* Label */}
              <div className="mt-2 text-[11px] font-medium text-foreground leading-tight text-center line-clamp-2">
                {badgeLabel}
              </div>

              {/* Caption */}
              <div className={cn(
                'text-[10px] text-center',
                completed && 'text-amber-600 font-medium',
                unlocked && !completed && 'text-emerald-600 font-medium',
                !unlocked && isNext && 'text-primary font-medium',
                !unlocked && !isNext && 'text-muted-foreground'
              )}>
                {status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Underline progress bar */}
      <div className="mt-2 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{
            width: `${Math.min((playedCount / maxThreshold) * 100, 100)}%`,
          }}
        />
      </div>
    </section>
  );
};
