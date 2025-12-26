import React, { useRef, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { MILESTONE_THEMES, type MilestoneTier } from '@/lib/globalAchievementMilestoneSystem';

// Milestone thresholds in order
const THRESHOLDS: MilestoneTier[] = [5, 10, 20, 50, 100, 200, 300, 400];

// Milestone names
const TIER_NAMES: Record<MilestoneTier, string> = {
  5: 'Rookie',
  10: 'Fairway',
  20: 'Founders',
  50: 'Heritage',
  100: 'Century',
  200: 'Elite',
  300: 'Legendary',
  400: 'Grand Slam',
};

interface MilestoneJourneyRailProps {
  totalPlayed: number;
  onMilestoneClick?: (threshold: MilestoneTier) => void;
}

export function MilestoneJourneyRail({
  totalPlayed,
  onMilestoneClick,
}: MilestoneJourneyRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const currentTargetRef = useRef<HTMLButtonElement>(null);

  // Find completed milestones and current target
  const completedMilestones = THRESHOLDS.filter((t) => totalPlayed >= t);
  const currentTargetIndex = THRESHOLDS.findIndex((t) => totalPlayed < t);
  const currentTarget = currentTargetIndex >= 0 ? THRESHOLDS[currentTargetIndex] : null;
  const lastCompleted = completedMilestones.length > 0
    ? completedMilestones[completedMilestones.length - 1]
    : 0;

  // Calculate progress between last completed and current target
  const progressBetween = currentTarget
    ? (totalPlayed - lastCompleted) / (currentTarget - lastCompleted)
    : 1;

  // Calculate progress percentage for the track fill
  // Each segment between nodes is equal width
  const segmentWidth = 100 / (THRESHOLDS.length - 1);
  const completedSegments = completedMilestones.length > 0 
    ? THRESHOLDS.indexOf(completedMilestones[completedMilestones.length - 1])
    : -1;
  const baseProgress = completedSegments >= 0 ? completedSegments * segmentWidth : 0;
  const partialProgress = currentTarget ? progressBetween * segmentWidth : 0;
  const trackFillPercent = Math.min(100, baseProgress + partialProgress);

  // Get the accent color for track fill (use current target or last completed tier)
  const fillTier = currentTarget ?? lastCompleted;
  const fillTheme = MILESTONE_THEMES[fillTier as MilestoneTier] ?? MILESTONE_THEMES[5];

  // Calculate remaining for next milestone
  const remaining = currentTarget ? currentTarget - totalPlayed : 0;
  const nextMilestoneName = currentTarget ? TIER_NAMES[currentTarget] : null;

  // Scroll current target into view on mount
  useEffect(() => {
    if (currentTargetRef.current && railRef.current) {
      const rail = railRef.current;
      const target = currentTargetRef.current;
      const railRect = rail.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollLeft = target.offsetLeft - rail.offsetWidth / 2 + target.offsetWidth / 2;
      rail.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [currentTarget]);

  return (
    <section className="space-y-3 mt-6">
      {/* Header */}
      <div className="px-2.5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-foreground/80 mb-1">
          Milestone Journey
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Track your progress across all Top 100 lists
        </p>
      </div>

      {/* Glass container */}
      <div 
        className="rounded-sq-lg p-4 backdrop-blur-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Rail with nodes */}
        <div 
          ref={railRef}
          className="overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="relative min-w-max px-6 py-4">
            {/* Track behind nodes */}
            <div className="absolute top-1/2 left-6 right-6 h-1 -translate-y-1/2 rounded-full bg-white/10">
              {/* Fill track */}
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${trackFillPercent}%`,
                  background: `linear-gradient(90deg, ${fillTheme.bgDark}, ${fillTheme.bgLight})`,
                  boxShadow: `0 0 12px ${fillTheme.bgDark}40`,
                }}
              />
            </div>

            {/* Nodes */}
            <div className="relative flex items-center gap-8">
              {THRESHOLDS.map((threshold, index) => {
                const isCompleted = totalPlayed >= threshold;
                const isCurrentTarget = threshold === currentTarget;
                const theme = MILESTONE_THEMES[threshold];
                const tierName = TIER_NAMES[threshold];

                return (
                  <button
                    key={threshold}
                    ref={isCurrentTarget ? currentTargetRef : undefined}
                    type="button"
                    onClick={() => onMilestoneClick?.(threshold)}
                    className="relative flex flex-col items-center focus:outline-none group"
                    style={{ minWidth: 72 }}
                  >
                    {/* Node circle */}
                    <div
                      className={`
                        relative w-14 h-14 rounded-full flex items-center justify-center
                        transition-all duration-300 z-10
                        ${isCurrentTarget ? 'scale-110' : ''}
                      `}
                      style={{
                        background: isCompleted
                          ? `linear-gradient(135deg, ${theme.bgLight}30, ${theme.bgDark}40)`
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isCompleted
                          ? `2px solid ${theme.bgDark}`
                          : isCurrentTarget
                            ? '2px solid rgba(255, 255, 255, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isCompleted
                          ? `0 0 20px ${theme.bgDark}30, inset 0 1px 1px rgba(255,255,255,0.1)`
                          : isCurrentTarget
                            ? '0 0 20px rgba(255, 255, 255, 0.1)'
                            : 'none',
                        animation: isCurrentTarget ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                      }}
                    >
                      {/* Trophy icon for completed */}
                      {isCompleted && (
                        <Trophy 
                          className="absolute -top-1 -right-1 w-4 h-4"
                          style={{ color: theme.bgDark }}
                        />
                      )}
                      
                      {/* Number */}
                      <span
                        className={`
                          text-base font-bold
                          ${isCompleted ? '' : isCurrentTarget ? 'text-white/80' : 'text-white/40'}
                        `}
                        style={isCompleted ? { color: theme.bgDark } : undefined}
                      >
                        {threshold}
                      </span>
                    </div>

                    {/* Label */}
                    <div className="mt-2 text-center">
                      <p
                        className={`
                          text-[11px] font-medium whitespace-nowrap
                          ${isCompleted ? 'text-foreground' : isCurrentTarget ? 'text-foreground/70' : 'text-muted-foreground/50'}
                        `}
                      >
                        {tierName}
                      </p>
                      <p
                        className={`
                          text-[9px] mt-0.5
                          ${isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/40'}
                        `}
                      >
                        {isCompleted ? 'Unlocked' : `${threshold - totalPlayed} away`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next milestone text */}
        {nextMilestoneName && remaining > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 text-center">
            <p className="text-[12px] text-muted-foreground">
              <span className="text-foreground/80 font-medium">{remaining}</span>
              {' '}more to reach{' '}
              <span className="text-foreground/80 font-medium">{nextMilestoneName} Club</span>
            </p>
          </div>
        )}

        {/* All complete message */}
        {!currentTarget && totalPlayed >= 400 && (
          <div className="mt-3 pt-3 border-t border-white/5 text-center">
            <p className="text-[12px] text-muted-foreground">
              <Trophy className="inline w-3 h-3 mr-1 text-amber-400" />
              <span className="text-foreground/80 font-medium">All milestones achieved!</span>
            </p>
          </div>
        )}
      </div>

      {/* Keyframes for pulse animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.2), 0 0 40px rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </section>
  );
}
