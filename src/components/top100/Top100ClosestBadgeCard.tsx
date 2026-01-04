import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { TOP100_MILESTONES } from '@/config/top100Milestones';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { cn } from '@/lib/utils';
import { AnimatedNumber, AnimatedProgressBar } from '@/components/ui/motion';

interface Top100ClosestBadgeCardProps {
  totalTop100Played: number;
  onOpenDetail?: (milestone: typeof TOP100_MILESTONES[0]) => void;
}

/**
 * Get the tier accent color from palette
 */
function getTierAccentColor(threshold: number): string {
  if (MILESTONE_PALETTE_MAP[threshold]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[threshold]];
  }
  return '#94a3b8';
}

/**
 * Merged "Closest Badge" module (E1)
 * 
 * Combines:
 * - Badge you're close to
 * - List completions context
 * 
 * Features:
 * - Single clear module
 * - Progress bar
 * - "See requirements" CTA opens detail sheet
 */
export function Top100ClosestBadgeCard({ 
  totalTop100Played,
  onOpenDetail,
}: Top100ClosestBadgeCardProps) {
  // Find the closest milestone where user is within 1–20 courses
  const candidates = TOP100_MILESTONES
    .map(m => ({
      ...m,
      remaining: m.threshold - totalTop100Played,
    }))
    .filter(m => m.remaining > 0 && m.remaining <= 30)
    .sort((a, b) => a.remaining - b.remaining);

  const closest = candidates[0];

  if (!closest) return null;

  const accentColor = getTierAccentColor(closest.threshold);
  const progress = totalTop100Played;
  const target = closest.threshold;
  const progressPercent = Math.min(100, (progress / target) * 100);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-2.5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
          Closest Badge
        </h2>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          <AnimatedNumber value={totalTop100Played} minCh={1} /> courses logged
        </span>
      </div>
      {/* Single badge card - lighter padding (E2) */}
      <div 
        className={cn(
          "mx-2.5 rounded-sq-md border bg-card/60 p-3.5 relative overflow-hidden",
          "hover:bg-card/80 transition-colors cursor-pointer"
        )}
        style={{ borderColor: `${accentColor}30` }}
        onClick={() => onOpenDetail?.(closest)}
      >
        {/* Trophy silhouette watermark (E2) */}
        <div 
          className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-[0.03]"
          style={{
            background: `radial-gradient(ellipse at top right, ${accentColor} 0%, transparent 70%)`,
          }}
        >
          <Trophy className="w-full h-full" style={{ color: accentColor }} />
        </div>

        <div className="flex items-start gap-3 relative z-10">
          {/* Trophy medallion */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}25`,
            }}
          >
            <Trophy className="w-5 h-5" style={{ color: accentColor }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {closest.label}
              </h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>

            {/* Progress text */}
            <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
              <AnimatedNumber value={progress} minCh={1} /> / {target} courses
              <span className="text-foreground font-medium ml-2">
                <AnimatedNumber value={closest.remaining} minCh={1} delay={0.05} /> away
              </span>
            </p>

            {/* Progress bar - increased contrast bg (item 8) */}
            <div className="mt-3 h-2 rounded-full bg-border/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ 
                  width: `${progressPercent}%`, 
                  backgroundColor: accentColor,
                }}
              />
            </div>

            {/* CTA - underline on hover (item 8) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail?.(closest);
              }}
              className="mt-3 text-xs font-medium underline-offset-2 hover:underline"
              style={{ color: accentColor }}
            >
              See requirements →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}