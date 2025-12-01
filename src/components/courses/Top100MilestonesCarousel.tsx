import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';

// Show all tiers from 5 through 400 in order
const MILESTONES: Top100ClubMeta[] = CLUB_STEPS;

// Emoji mapping per tierId
function getMilestoneEmoji(tierId: string): string {
  const emojiMap: Record<string, string> = {
    bronze: '🥉',
    blue: '🔵',
    green: '🟢',
    silver: '🥈',
    gold: '🥇',
    platinum: '🏆',
    obsidian: '👑',
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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-4">Milestones</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 -mx-4 snap-x snap-mandatory scrollbar-hide">
        {MILESTONES.map((milestone) => {
          const isUnlocked = totalPlayed >= milestone.threshold;
          const remaining = Math.max(0, milestone.threshold - totalPlayed);
          const isNext = !isUnlocked && (
            MILESTONES.findIndex(m => totalPlayed < m.threshold) === MILESTONES.indexOf(milestone)
          );

          return (
            <button
              key={milestone.threshold}
              onClick={() => onMilestoneClick?.(milestone)}
              className={cn(
                'flex-shrink-0 w-36 p-3 rounded-xl border transition-all snap-center',
                'hover:scale-[1.02] active:scale-[0.98]',
                isUnlocked
                  ? 'bg-gradient-to-br from-primary-accent/10 to-primary-accent/5 border-primary-accent/30'
                  : isNext
                  ? 'bg-card border-primary-accent/20'
                  : 'bg-card border-border/50'
              )}
            >
              <div className="flex flex-col items-center text-center gap-1">
                <div className="text-2xl mb-1">{getMilestoneEmoji(milestone.tierId)}</div>
                <p className="text-[11px] font-semibold text-foreground">
                  {milestone.tierName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {milestone.shortLabel}
                </p>
                {isUnlocked ? (
                  <div className="flex items-center gap-1 text-[11px] text-primary-accent mt-1">
                    <Check className="h-3 w-3" />
                    Unlocked!
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {remaining} course{remaining === 1 ? '' : 's'} away
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
