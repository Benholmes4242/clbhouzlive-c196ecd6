import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  threshold: number;
  label: string;
  emoji: string;
}

const MILESTONES: Milestone[] = [
  { id: '20', threshold: 20, label: '20 Club', emoji: '🥉' },
  { id: '50', threshold: 50, label: '50 Club', emoji: '🥈' },
  { id: '100', threshold: 100, label: 'The Century Club', emoji: '🥇' },
  { id: '200', threshold: 200, label: 'Clubhouse Elite', emoji: '🏆' },
  { id: '300', threshold: 300, label: 'Club Collector', emoji: '👑' },
];

interface Top100MilestonesCarouselProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: Milestone) => void;
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
              key={milestone.id}
              onClick={() => onMilestoneClick?.(milestone)}
              className={cn(
                'flex-shrink-0 w-32 p-3 rounded-xl border transition-all snap-center',
                'hover:scale-[1.02] active:scale-[0.98]',
                isUnlocked
                  ? 'bg-gradient-to-br from-primary-accent/10 to-primary-accent/5 border-primary-accent/30'
                  : isNext
                  ? 'bg-card border-primary-accent/20'
                  : 'bg-card border-border/50'
              )}
            >
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="text-2xl mb-1">{milestone.emoji}</div>
                <div className="text-xs font-semibold text-foreground">
                  {milestone.label}
                </div>
                {isUnlocked ? (
                  <div className="flex items-center gap-1 text-[11px] text-primary-accent">
                    <Check className="h-3 w-3" />
                    Unlocked!
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground">
                    {remaining} {remaining === 1 ? 'course' : 'courses'} away
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
