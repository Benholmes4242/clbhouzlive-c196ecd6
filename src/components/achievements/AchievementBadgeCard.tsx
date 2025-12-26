import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getTierPalette, 
  MILESTONE_THEMES,
  MilestoneTier,
} from '@/lib/globalAchievementMilestoneSystem';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
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

/**
 * Get the tier accent color from CLBHOUZ_ACHIEVEMENT_PALETTE
 */
function getTierAccentColor(tier: string): string {
  const threshold = parseInt(tier, 10);
  if (!isNaN(threshold) && MILESTONE_PALETTE_MAP[threshold]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[threshold]];
  }
  // Regional tiers - use specific colors
  const regionalColors: Record<string, string> = {
    'GBI': '#4A7C59',
    'EU': '#5B7EC0',
    'USA': '#C75B5B',
    'WORLD': '#7A8FC0',
  };
  return regionalColors[tier] || '#94a3b8';
}

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
 * Modern glass design with tier color accents:
 * - Dark glass base (not tier-colour filled)
 * - Left vertical accent strip (tier colour)
 * - Trophy icon (tier colour)
 * - Title text (tier colour)
 * - Watermark line art (tier colour at ~6% opacity)
 * - Status chip with tier colour tint
 * 
 * All colors sourced from globalAchievementMilestoneSystem.ts / clbhouzAchievementPalette.ts
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
  const tierLabel = TIER_LABELS[tier] || tier;
  const clubName = CLUB_NAMES[tier] || title;
  const emblemSrc = getEmblemPath(tier);
  
  // Get tier accent color
  const tierAccentColor = getTierAccentColor(tier);
  const lockedColor = '#94a3b8';
  const accentColor = unlocked && !isGhost ? tierAccentColor : lockedColor;
  
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
  
  if (isMilestone && unlocked && !isGhost && totalTop100Played !== undefined) {
    const currentIndex = MILESTONE_THRESHOLDS.indexOf(threshold);
    if (currentIndex >= 0 && currentIndex < MILESTONE_THRESHOLDS.length - 1) {
      nextTier = MILESTONE_THRESHOLDS[currentIndex + 1];
      remainingToNext = nextTier - totalTop100Played;
      
      if (remainingToNext > 0) {
        const gapSize = nextTier - threshold;
        const progressInGap = totalTop100Played - threshold;
        progressToNext = gapSize > 0 ? Math.min(100, (progressInGap / gapSize) * 100) : 0;
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
        // Glass card container with SDS rounded corners
        'rounded-sq-md flex flex-col justify-between transition-all duration-150 relative overflow-hidden',
        // Fixed global size for ALL achievement badges site-wide
        'min-w-[180px] h-[92px] pl-0 pr-3 py-2.5',
        // Micro-interactions
        'active:scale-[0.98]',
        unlocked && !isGhost && 'hover:shadow-lg',
        // Ghost styling
        isGhost && 'border border-dashed'
      )}
      style={{
        // Glass base - neutral dark background
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${unlocked && !isGhost ? `${accentColor}25` : 'rgba(255, 255, 255, 0.10)'}`,
        backdropFilter: 'blur(12px)',
        transform: isPrimary ? 'translateY(-2px)' : undefined,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.75 : 1),
        boxShadow: unlocked && !isGhost 
          ? `0 4px 20px ${accentColor}15`
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Left vertical accent strip */}
      <div 
        className="absolute left-0 top-3 bottom-3 w-[4px] rounded-r-full"
        style={{ 
          backgroundColor: accentColor,
          opacity: unlocked && !isGhost ? 0.9 : 0.4,
        }}
      />

      {/* Background emblem watermark - tier-colored at ~6% opacity */}
      {emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-y-0 right-0 h-full w-auto translate-x-4 scale-125"
          style={{ 
            opacity: 0.06,
            filter: unlocked && !isGhost 
              ? `brightness(0) saturate(100%)` 
              : 'brightness(0)',
          }}
        />
      )}

      {/* Ghost overlay */}
      {isGhost && (
        <div 
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        />
      )}

      {/* Top row: Trophy icon + Title/Subtitle */}
      <div className="flex items-start gap-2 pl-4">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: unlocked && !isGhost 
              ? `${accentColor}18` 
              : 'rgba(148, 163, 184, 0.12)'
          }}
        >
          <Trophy 
            className="w-3.5 h-3.5"
            style={{ color: accentColor }} 
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden text-left">
          {/* Title in tier color */}
          <div 
            className="font-semibold leading-tight truncate text-[13px]"
            style={{ color: accentColor }}
          >
            {tierLabel}
          </div>
          {/* Subtitle in neutral */}
          <div className="text-[11px] text-white/65 truncate">
            {isMilestone ? clubName : subtitle}
          </div>
        </div>
      </div>

      {/* Bottom row: Status chip */}
      <div className="flex justify-end pl-4">
        <div 
          className="inline-flex items-center px-2 py-0.5 rounded-sq-xs text-[10px] font-medium"
          style={{
            backgroundColor: unlocked && !isGhost 
              ? `${accentColor}20` 
              : 'rgba(148, 163, 184, 0.15)',
            border: `1px solid ${unlocked && !isGhost 
              ? `${accentColor}40` 
              : 'rgba(148, 163, 184, 0.25)'}`,
            color: unlocked && !isGhost ? accentColor : '#94a3b8',
          }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;
