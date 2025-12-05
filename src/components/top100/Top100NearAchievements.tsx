import React from 'react';
import { TOP100_MILESTONES } from '@/config/top100Milestones';

interface Top100NearAchievementsProps {
  totalTop100Played: number;
}

export function Top100NearAchievements({ totalTop100Played }: Top100NearAchievementsProps) {
  // Show milestones where user is within 1–20 courses
  const candidates = TOP100_MILESTONES
    .map(m => ({
      ...m,
      remaining: m.threshold - totalTop100Played,
    }))
    .filter(m => m.remaining > 0 && m.remaining <= 20)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);

  if (candidates.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between px-2.5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
          Badges you're close to
        </h2>
        <span className="text-xs text-muted-foreground">
          {totalTop100Played} courses logged
        </span>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {candidates.map(m => (
          <button
            key={m.id}
            type="button"
            className="flex min-w-[180px] items-center gap-3 rounded-sq-md bg-card border border-border/60 px-3 py-2.5 text-left shadow-[0_1px_4px_rgba(15,23,42,0.06)] hover:bg-accent/50 transition-colors"
          >
            {/* Mini squircle - new spec: 1/1.05 aspect ratio, 34% border radius */}
            <div 
              className="flex items-center justify-center bg-white text-xs font-semibold"
              style={{ 
                width: '40px',
                aspectRatio: '1 / 1.05',
                borderRadius: '34%',
                border: `2px solid ${m.ringColor}`,
                color: m.ringColor,
              }}
            >
              {m.threshold}
            </div>

            <div className="flex flex-1 flex-col">
              <span className="text-xs font-semibold text-foreground">
                {m.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Only{' '}
                <span className="font-semibold" style={{ color: m.ringColor }}>
                  {m.remaining} more
                </span>{' '}
                Top 100 courses
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
