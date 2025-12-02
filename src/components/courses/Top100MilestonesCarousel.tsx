import React from 'react';
import { Flag, Leaf, BadgeCheck, Archive, Gauge, Crown, Zap, Trophy, Target, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLUB_STEPS, Top100ClubMeta } from '@/lib/top100Club';

// Show all tiers from 5 through 400 in order
const MILESTONES: Top100ClubMeta[] = CLUB_STEPS;

// Tier colors
const TIER_COLORS: Record<string, string> = {
  none: '#94a3b8',
  rookie: '#D9C7A3',
  fairway: '#8BBF5A',
  founders: '#2E5930',
  heritage: '#C8A44B',
  century: '#B7BCC6',
  elite: '#D9A441',
  legendary: '#5A3E8C',
  grandslam: '#0C0F14',
};

// SVG icon mapping per tierId
function getTierIcon(tierId: string) {
  const iconClass = "w-4 h-4";
  switch (tierId) {
    case 'rookie':
      return <Flag className={iconClass} />;
    case 'fairway':
      return <Leaf className={iconClass} />;
    case 'founders':
      return <BadgeCheck className={iconClass} />;
    case 'heritage':
      return <Archive className={iconClass} />;
    case 'century':
      return <Gauge className={iconClass} />;
    case 'elite':
      return <Crown className={iconClass} />;
    case 'legendary':
      return <Zap className={iconClass} />;
    case 'grandslam':
      return <Trophy className={iconClass} />;
    default:
      return <Target className={iconClass} />;
  }
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
    <section className="mt-6 w-full">
      <h3 className="text-sm font-semibold mb-2 px-1">Milestones</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
        {MILESTONES.map((milestone) => {
          const isUnlocked = totalPlayed >= milestone.threshold;
          const remaining = Math.max(0, milestone.threshold - totalPlayed);

          const nextIndex = MILESTONES.findIndex(m => totalPlayed < m.threshold);
          const isNext = !isUnlocked && nextIndex === MILESTONES.indexOf(milestone);

          const progressPct = Math.min(
            100,
            Math.max(0, (totalPlayed / milestone.threshold) * 100),
          );

          const tierColor = TIER_COLORS[milestone.tierId] || TIER_COLORS.none;

          const baseClasses =
            'flex-shrink-0 w-44 md:w-48 rounded-xl border px-3 py-3 snap-center flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]';

          const stateClasses = isUnlocked
            ? 'bg-gradient-to-br from-[rgba(255,255,255,0.9)] to-[rgba(240,249,255,0.9)] border-border/60 shadow-sm'
            : isNext
            ? 'bg-card border-[rgba(148,163,184,0.8)] shadow-sm'
            : 'bg-card border-border/60 opacity-80';

          return (
            <button
              key={milestone.threshold}
              type="button"
              onClick={() => onMilestoneClick?.(milestone)}
              className={`${baseClasses} ${stateClasses}`}
            >
              {/* Icon row */}
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${tierColor}1A` }}
                >
                  <span style={{ color: tierColor }}>
                    {getTierIcon(milestone.tierId)}
                  </span>
                </div>

                {isUnlocked && (
                  <span className="text-[11px] font-medium px-2 py-[3px] rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/40 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Unlocked
                  </span>
                )}
              </div>

              {/* Text labels */}
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-semibold">{milestone.tierName}</span>
                <span className="text-xs text-muted-foreground">
                  {milestone.threshold} courses
                </span>
              </div>

              {/* Progress */}
              {!isUnlocked && (
                <div className="mt-1.5">
                  <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, backgroundColor: tierColor }}
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
