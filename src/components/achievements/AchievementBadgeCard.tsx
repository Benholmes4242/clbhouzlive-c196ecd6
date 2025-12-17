import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getTierPalette, 
  MILESTONE_THEMES,
  MilestoneTier,
} from '@/lib/globalAchievementMilestoneSystem';
import { getEmblemPath } from '@/lib/achievementEmblems';

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
  compact?: boolean; // Deprecated - kept for backwards compatibility, ignored
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
 * World-class premium badge card with:
 * - Top row: tier band + status chip
 * - Hero value block (threshold number)
 * - Label row: trophy + named club
 * - Bottom micro-progress to next tier
 * 
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
  const emblemSrc = getEmblemPath(tier);
  
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

  // Convert hex to rgba for glass tinting
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Glass background with tier color tint
  const glassBackground = unlocked && !isGhost
    ? `linear-gradient(135deg, ${hexToRgba(palette.bgLight, 0.25)}, ${hexToRgba(palette.bgDark, 0.35)})`
    : 'rgba(148, 163, 184, 0.15)';

  return (
    <div
      className={cn(
        // Horizontal rectangle with SDS rounded corners - GLOBAL SIZE for all badges
        'rounded-sq-md flex flex-col justify-between transition-all duration-150 relative overflow-hidden',
        // Fixed global size for ALL achievement badges site-wide
        'min-w-[180px] h-[92px] px-3 py-2.5',
        // Liquid glass effect
        'backdrop-blur-xl border border-white/20',
        // Micro-interactions
        'active:scale-[0.98]',
        // Ghost styling
        isGhost && 'border-dashed border-white/60'
      )}
      style={{
        background: glassBackground,
        transform: isPrimary ? 'translateY(-2px)' : undefined,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.85 : 1),
      }}
    >
      {/* Background emblem - engraved crest effect */}
      {emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-y-0 right-0 h-full w-auto translate-x-4 scale-125 opacity-[0.08]"
          style={{ 
            filter: 'brightness(0)',
          }}
        />
      )}

      {/* Ghost overlay */}
      {isGhost && (
        <div className="absolute inset-0 rounded-[inherit] bg-white/40 pointer-events-none" />
      )}

      {/* Top left: Trophy icon + Title/Subtitle */}
      <div className="flex items-start gap-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: unlocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' 
          }}
        >
          {/* Trophy uses tier accent color when unlocked */}
          <Trophy 
            className="w-3.5 h-3.5"
            style={{ color: unlocked ? palette.accent : 'rgba(255,255,255,0.5)' }} 
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden text-left">
          <div className="font-semibold leading-tight text-white truncate text-[13px]">
            {isMilestone ? `${threshold} Club` : title}
          </div>
          <div className="text-[11px] text-white/70 truncate">
            {isMilestone ? clubName : subtitle}
          </div>
        </div>
      </div>

      {/* Bottom right: Status chip */}
      <div className="flex justify-end">
        <div className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-sq-xs text-[10px] font-medium",
          unlocked && !isGhost
            ? "bg-white/20 text-white"
            : "bg-white/10 text-white/60"
        )}>
          {statusLabel}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;
