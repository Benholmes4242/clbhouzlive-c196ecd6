import React from 'react';
import { TOP100_MILESTONES } from '@/config/top100Milestones';

interface Top100MilestoneTimelineProps {
  totalTop100Played: number;
}

export function Top100MilestoneTimeline({ totalTop100Played }: Top100MilestoneTimelineProps) {
  const milestones = TOP100_MILESTONES;
  const nextIndex = milestones.findIndex(m => totalTop100Played < m.threshold);
  const maxThreshold = milestones[milestones.length - 1]?.threshold || 400;

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">Achievements</h2>
        <span className="text-xs text-muted-foreground">
          {totalTop100Played} / {maxThreshold} Top 100 courses
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {milestones.map((m, index) => {
          const unlocked = totalTop100Played >= m.threshold;
          const isNext = !unlocked && index === nextIndex;

          return (
            <div
              key={m.id}
              className="flex min-w-[80px] flex-col items-center gap-1"
            >
              {/* Squircle badge - new spec: 1/1.05 aspect ratio, 34% border radius */}
              <div
                className={`
                  flex items-center justify-center text-sm font-semibold
                  transition-all duration-200
                  ${
                    unlocked
                      ? 'text-white'
                      : isNext
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-slate-400 bg-slate-50'
                  }
                `}
                style={{
                  width: '64px',
                  aspectRatio: '1 / 1.05',
                  borderRadius: '34%',
                  border: unlocked 
                    ? `2px solid ${m.ringColor}` 
                    : isNext 
                    ? '2px solid #FBBF24' 
                    : '1px solid #D1D5DB',
                  backgroundColor: unlocked ? m.ringColor : undefined,
                }}
              >
                {m.threshold}
              </div>

              {/* Label */}
              <span className="mt-1 text-[11px] font-medium text-foreground text-center">
                {m.label}
              </span>

              {/* Status caption */}
              <span className="text-[10px] text-muted-foreground">
                {unlocked
                  ? 'Unlocked'
                  : isNext
                  ? `${m.threshold - totalTop100Played} away`
                  : `${m.threshold} courses`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar under row */}
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{
            width: `${Math.min((totalTop100Played / maxThreshold) * 100, 100)}%`,
          }}
        />
      </div>
    </section>
  );
}
