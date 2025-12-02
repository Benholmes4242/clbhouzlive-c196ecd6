import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';

// Show all tiers from 5 through 400 in order
const MILESTONES: Top100ClubMeta[] = CLUB_STEPS;

// Emoji mapping per tierId
function getMilestoneEmoji(tierId: string): string {
  const emojiMap: Record<string, string> = {
    rookie: '⛳',
    fairway: '🌱',
    founders: '🌲',
    heritage: '🏛️',
    century: '💯',
    elite: '👑',
    legendary: '⚡',
    grandslam: '🏆',
  };
  return emojiMap[tierId] || '🎯';
}

interface Top100MilestonesCarouselProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: Top100ClubMeta) => void;
}

export function Top100MilestonesCarousel({
  totalPlayed,
  onMilestoneClick,
}: Top100MilestonesCarouselProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Milestones</h3>
      <div className="flex gap-3 overflow-x-auto snap-x scrollbar-hide">
        {MILESTONES.map((milestone) => {
          const isUnlocked = totalPlayed >= milestone.threshold;
          const remaining = Math.max(0, milestone.threshold - totalPlayed);
          const isNext = !isUnlocked && (
            MILESTONES.findIndex(m => totalPlayed < m.threshold) === MILESTONES.indexOf(milestone)
          );

          const progressPct = Math.min(
            100,
            Math.max(0, (totalPlayed / milestone.threshold) * 100)
          );

          const cardClass = cn(
            'flex-shrink-0 w-40 p-3 rounded-xl border transition-all snap-center flex flex-col gap-1',
            'hover:scale-[1.02] active:scale-[0.98]',
            isUnlocked
              ? 'bg-gradient-to-br from-primary-accent/12 to-primary-accent/5 border-primary-accent/40 shadow-sm'
              : isNext
              ? 'bg-card border-primary-accent/30'
              : 'bg-card border-border/40 opacity-80'
          );

          return (
            <button
              key={milestone.tierId}
              type="button"
              onClick={() => onMilestoneClick?.(milestone)}
              className={cardClass}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{getMilestoneEmoji(milestone.tierId)}</span>
                {isUnlocked && (
                  <span className="text-[10px] font-semibold text-primary-accent">
                    Unlocked
                  </span>
                )}
              </div>

              <div className="mt-1">
                <p className="text-xs font-semibold text-foreground">
                  {milestone.tierName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {milestone.shortLabel}
                </p>
              </div>

              {!isUnlocked && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-primary-accent transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {remaining} course{remaining === 1 ? '' : 's'} away
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
