import React from 'react';
import { Trophy, Check } from 'lucide-react';
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
 * AchievementBadgeCard - Frosted Glass Glassmorphism Design
 * 
 * Premium iOS/VisionOS-inspired achievement card with:
 * - Translucent glass background with backdrop blur
 * - Subtle edge highlights and soft shadows
 * - Monochrome white iconography
 * - Smooth micro-interactions on hover/tap
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

  return (
    <div
      className={cn(
        // Frosted glass base with SDS rounded corners
        'rounded-[18px] flex flex-col justify-between relative overflow-hidden',
        // Fixed global size for ALL achievement badges site-wide
        'min-w-[180px] h-[92px] px-3 py-2.5',
        // Glassmorphism backdrop blur
        'backdrop-blur-[16px] backdrop-saturate-[140%]',
        // Subtle border for floating effect
        'border border-white/[0.18]',
        // Smooth micro-interactions
        'transition-all duration-200 ease-out',
        'active:scale-[0.98]',
        unlocked && !isGhost && 'hover:scale-[1.02] hover:backdrop-blur-[18px]',
        // Ghost styling
        isGhost && 'border-dashed'
      )}
      style={{
        // Translucent glass background
        background: unlocked && !isGhost
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(255, 255, 255, 0.06)',
        // Inner highlight gradient for Apple feel
        backgroundImage: unlocked && !isGhost
          ? 'linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, transparent 40%)'
          : 'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 40%)',
        transform: isPrimary ? 'translateY(-2px)' : undefined,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.6 : 1),
      }}
    >
      {/* Background emblem - subtle engraved crest */}
      {emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-y-0 right-0 h-full w-auto translate-x-4 scale-125"
          style={{ 
            filter: 'brightness(0) invert(1)',
            opacity: unlocked && !isGhost ? 0.08 : 0.04,
          }}
        />
      )}

      {/* Ghost overlay */}
      {isGhost && (
        <div className="absolute inset-0 rounded-[inherit] bg-white/10 pointer-events-none" />
      )}

      {/* Top left: Trophy icon + Title/Subtitle */}
      <div className="flex items-start gap-2 relative z-10">
        {/* Trophy icon - monochrome white, no solid background */}
        <Trophy 
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ 
            color: unlocked && !isGhost ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
          }} 
        />
        <div className="flex-1 min-w-0 overflow-hidden text-left">
          {/* Title - white/near-white, medium weight */}
          <div 
            className="font-medium leading-tight truncate text-[13px]"
            style={{ 
              color: unlocked && !isGhost ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
            }}
          >
            {isMilestone ? `${threshold} Club` : title}
          </div>
          {/* Subtitle - smaller, reduced opacity */}
          <div 
            className="text-[11px] truncate"
            style={{ 
              color: unlocked && !isGhost ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)',
            }}
          >
            {isMilestone ? clubName : subtitle}
          </div>
        </div>
      </div>

      {/* Bottom right: Glass micro-badge */}
      <div className="flex justify-end relative z-10">
        <div 
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
            "backdrop-blur-[10px]",
            "border",
            "transition-all duration-200"
          )}
          style={{
            background: unlocked && !isGhost 
              ? 'rgba(255,255,255,0.18)' 
              : 'rgba(255,255,255,0.08)',
            borderColor: unlocked && !isGhost 
              ? 'rgba(255,255,255,0.25)' 
              : 'rgba(255,255,255,0.12)',
            color: unlocked && !isGhost 
              ? 'rgba(255,255,255,0.9)' 
              : 'rgba(255,255,255,0.5)',
          }}
        >
          {/* Optional green glass tick for unlocked state */}
          {unlocked && !isGhost && (
            <Check 
              className="w-3 h-3" 
              style={{ color: 'rgba(134,239,172,0.9)' }} 
            />
          )}
          <span className="uppercase tracking-wider">{statusLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;
