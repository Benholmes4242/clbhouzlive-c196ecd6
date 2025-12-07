import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getTierPalette, 
} from '@/lib/globalAchievementMilestoneSystem';

export type AchievementStatus = 'UNLOCKED' | 'LOCKED' | 'NEW';
export type AchievementType = 'MILESTONE' | 'LIST' | 'SKILL' | 'SEASONAL';

export type AchievementTier =
  | '5'
  | '10'
  | '20'
  | '50'
  | '100'
  | '200'
  | '300'
  | '400'
  | 'GBI'
  | 'EU'
  | 'USA'
  | 'WORLD';

// Tier label mapping
const TIER_LABELS: Record<string, string> = {
  '5': 'ROOKIE',
  '10': 'FAIRWAY',
  '20': 'FOUNDERS',
  '50': 'HERITAGE',
  '100': 'CENTURY',
  '200': 'ELITE',
  '300': 'LEGENDARY',
  '400': 'GRAND SLAM',
  'GBI': 'GB&I',
  'EU': 'EUROPE',
  'USA': 'USA',
  'WORLD': 'WORLD',
};

// Club name mapping
const CLUB_NAMES: Record<string, string> = {
  '5': 'Rookie Club',
  '10': 'Fairway Club',
  '20': 'Founders Club',
  '50': 'Heritage Club',
  '100': 'Century Club',
  '200': 'Elite Club',
  '300': 'Legendary Club',
  '400': 'Grand Slam Club',
  'GBI': 'GB&I Complete',
  'EU': 'Europe Complete',
  'USA': 'USA Complete',
  'WORLD': 'World Complete',
};

// Milestone thresholds for next tier calculation
const MILESTONE_THRESHOLDS: number[] = [5, 10, 20, 50, 100, 200, 300, 400];

export interface AchievementBadgeCardProps {
  tier: AchievementTier;
  title: string;
  subtitle: string;
  unlocked: boolean;
  isPrimary?: boolean;
  unlockedAt?: string;
  remaining?: number;
  compact?: boolean;
  isGhost?: boolean;
  status?: AchievementStatus;
  // For progress to next tier (milestone cards)
  totalTop100Played?: number;
  // For regional cards
  playedOnList?: number;
  totalOnList?: number;
  regionGlyph?: React.ReactNode;
}

/**
 * AchievementBadgeCard - Global Achievement & Milestone System
 * 
 * Canonical SDS-compliant badge card with consistent layout:
 * - Top row: tier pill + status text
 * - Middle: hero stat (big number or title)
 * - Bottom row: trophy + club name
 * - Optional: micro-progress bar
 * 
 * Uses SDS tokens: sds-achievement-* from index.css
 * All colors sourced from globalAchievementMilestoneSystem.ts
 */
export const AchievementBadgeCard: React.FC<AchievementBadgeCardProps> = ({
  tier,
  title,
  subtitle,
  unlocked,
  isPrimary = false,
  remaining,
  compact = false,
  isGhost = false,
  status,
  totalTop100Played,
  playedOnList,
  totalOnList,
  regionGlyph,
}) => {
  const palette = getTierPalette(tier, unlocked && !isGhost);
  const tierLabel = TIER_LABELS[tier] || tier;
  const clubName = CLUB_NAMES[tier] || title;
  
  // Determine if this is a milestone (numeric) or regional card
  const threshold = parseInt(tier, 10);
  const isMilestone = !isNaN(threshold);
  const isRegional = !isMilestone;
  
  // Derive status label
  const statusLabel = status 
    ? status === 'NEW' ? 'New' : status === 'UNLOCKED' ? 'Unlocked' : 'Locked'
    : isGhost 
      ? 'Next badge' 
      : unlocked 
        ? 'Unlocked' 
        : remaining !== undefined 
          ? `${remaining} away` 
          : 'Locked';

  // Calculate next tier progress for milestone cards
  let nextTier: number | null = null;
  let progressToNext = 0;
  let remainingToNext = 0;
  let nextPalette: typeof palette | null = null;
  let nextTierLabel: string | null = null;
  
  if (isMilestone && unlocked && !isGhost && totalTop100Played !== undefined) {
    const currentIndex = MILESTONE_THRESHOLDS.indexOf(threshold);
    if (currentIndex >= 0 && currentIndex < MILESTONE_THRESHOLDS.length - 1) {
      nextTier = MILESTONE_THRESHOLDS[currentIndex + 1];
      remainingToNext = nextTier - totalTop100Played;
      
      if (remainingToNext > 0) {
        const gapSize = nextTier - threshold;
        const progressInGap = totalTop100Played - threshold;
        progressToNext = gapSize > 0 ? Math.min(100, (progressInGap / gapSize) * 100) : 0;
        nextPalette = getTierPalette(nextTier.toString(), true);
        nextTierLabel = TIER_LABELS[nextTier.toString()] || `${nextTier} Club`;
      } else {
        nextTier = null;
      }
    }
  }

  // For regional cards, calculate progress
  let regionalProgress = 0;
  if (isRegional && playedOnList !== undefined && totalOnList !== undefined && totalOnList > 0) {
    regionalProgress = Math.min(100, (playedOnList / totalOnList) * 100);
  }

  return (
    <div
      className={cn(
        // SDS canonical achievement card shape
        'sds-achievement-card',
        'flex flex-col justify-between',
        'rounded-sq-xl',
        'transition-all duration-150 relative',
        // Shadow based on state
        unlocked && !isGhost
          ? 'shadow-[0_10px_30px_rgba(15,23,42,0.12)]' 
          : 'shadow-sm',
        // Micro-interactions
        'active:scale-[0.97]',
        unlocked && !isGhost && 'hover:shadow-[0_16px_40px_rgba(16,185,129,0.18)]',
        // Ghost styling
        isGhost && 'border border-dashed border-white/60'
      )}
      style={{
        // SDS tokens for sizing
        minHeight: compact ? '110px' : 'var(--sds-achievement-min-h, 132px)',
        padding: compact 
          ? 'var(--sds-achievement-compact-padding-y, 10px) var(--sds-achievement-compact-padding-x, 12px)'
          : 'var(--sds-achievement-padding-y, 14px) var(--sds-achievement-padding-x, 16px)',
        // Gradient background
        background: unlocked && !isGhost
          ? `linear-gradient(145deg, ${palette.bgLight}, ${palette.bgDark})`
          : palette.bgLocked,
        transform: isPrimary ? 'translateY(-2px)' : undefined,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.85 : 1),
      }}
    >
      {/* Ghost overlay */}
      {isGhost && (
        <div className="absolute inset-0 rounded-[inherit] bg-white/40 pointer-events-none" />
      )}

      {/* TOP ROW: Tier pill + status */}
      <div className="flex items-start justify-between mb-auto">
        {/* Tier pill - sds-achievement-pill styling */}
        <div 
          className="sds-achievement-pill inline-flex items-center gap-1 rounded-full text-[11px] font-semibold tracking-wide uppercase"
          style={{
            padding: 'var(--sds-achievement-pill-padding-y, 4px) var(--sds-achievement-pill-padding-x, 10px)',
            backgroundColor: unlocked ? `${palette.accent}22` : 'rgba(148,163,184,0.15)',
            color: unlocked ? palette.accent : '#94a3b8',
          }}
        >
          {isRegional && regionGlyph && (
            <span className="inline-flex w-3.5 h-3.5 rounded-full overflow-hidden items-center justify-center">
              {regionGlyph}
            </span>
          )}
          <span>
            {isMilestone ? `${tierLabel} · ${threshold} CLUB` : tierLabel}
          </span>
        </div>

        {/* Status text - right aligned */}
        <span className={cn(
          "text-[11px] font-medium whitespace-nowrap",
          unlocked && !isGhost
            ? "text-slate-700"
            : "text-slate-500"
        )}>
          {statusLabel}
        </span>
      </div>

      {/* MIDDLE: Hero stat block */}
      <div className="flex-1 flex flex-col justify-center my-2">
        {isMilestone ? (
          <>
            <div className={cn(
              "font-semibold leading-none text-slate-900",
              compact ? "text-2xl" : "text-3xl"
            )}>
              {threshold}
            </div>
            <div className="text-xs text-slate-800/80 mt-0.5">
              Club
            </div>
          </>
        ) : (
          <>
            <div className={cn(
              "font-semibold leading-tight text-slate-900",
              compact ? "text-sm" : "text-base"
            )}>
              {title}
            </div>
            <div className="text-xs text-slate-800/80 mt-0.5">
              {subtitle}
            </div>
          </>
        )}
      </div>

      {/* BOTTOM ROW: Trophy + club name */}
      <div className="flex items-center gap-2 mt-auto">
        <div 
          className="rounded-full flex items-center justify-center w-6 h-6"
          style={{ 
            backgroundColor: unlocked ? `${palette.accent}1F` : 'rgba(148,163,184,0.12)' 
          }}
        >
          <Trophy 
            className="w-3.5 h-3.5"
            style={{ color: unlocked ? palette.accent : '#94a3b8' }} 
          />
        </div>
        <span className={cn(
          "text-xs font-medium",
          unlocked ? "text-slate-900/90" : "text-slate-600/80"
        )}>
          {clubName}
        </span>
      </div>

      {/* Micro-progress to next tier (milestone cards only, non-compact) */}
      {nextTier && nextPalette && remainingToNext > 0 && !compact && (
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="flex items-center justify-between text-[11px] text-slate-800/70 mb-1">
            <span>Next: {nextTierLabel}</span>
            <span>{remainingToNext} to go</span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden bg-white/35">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressToNext}%`,
                background: `linear-gradient(90deg, ${nextPalette.bgLight}, ${nextPalette.bgDark})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Progress row for regional cards (non-compact) */}
      {isRegional && playedOnList !== undefined && totalOnList !== undefined && !compact && (
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="flex items-center justify-between text-[11px] text-slate-800/75 mb-1">
            <span>{playedOnList} / {totalOnList} courses</span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden bg-white/35">
            <div
              className="h-full rounded-full"
              style={{
                width: `${regionalProgress}%`,
                background: `linear-gradient(90deg, ${palette.bgLight}, ${palette.bgDark})`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementBadgeCard;
