import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getTierPalette, 
  MILESTONE_THEMES,
  MilestoneTier,
  COLOR_SCALE,
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

// Achievement tier to CSS token mapping (1-8)
const TIER_TO_CSS_TOKEN: Record<string, number> = {
  '5': 1,
  '10': 2,
  '20': 3,
  '50': 4,
  '100': 5,
  '200': 6,
  '300': 7,
  '400': 8,
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
 * - CSS token-based backgrounds from --achv-1-bg to --achv-8-bg
 * - Grand Slam (400) gets special Masters gradient + gold accent
 * - Consistent text colors (dark on 1-5, light on 6-8)
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
  
  // Determine if this is a milestone (numeric) or regional card
  const threshold = parseInt(tier, 10);
  const isMilestone = !isNaN(threshold);
  const isRegional = !isMilestone;
  const isGrandSlam = tier === '400' && unlocked && !isGhost;
  
  // Get CSS token number for background
  const cssToken = TIER_TO_CSS_TOKEN[tier];
  const useCssTokenBg = isMilestone && cssToken && unlocked && !isGhost && !isGrandSlam;
  
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

  // Text color logic: tiers 1-5 get dark text, 6-8 get light text
  const useWhiteText = cssToken && cssToken >= 6;
  const textMainColor = isGrandSlam ? '#F9FAFB' : useWhiteText ? '#F9FAFB' : 'var(--achv-text-main)';
  const textSubtleColor = isGrandSlam ? 'rgba(249,250,251,0.8)' : useWhiteText ? 'rgba(249,250,251,0.7)' : 'var(--achv-text-subtle)';
  
  // Icon color - gold for Grand Slam, accent color for others
  const iconColor = isGrandSlam 
    ? 'var(--achv-gold)' 
    : unlocked 
      ? palette.accent 
      : '#94a3b8';

  return (
    <div
      className={cn(
        // Horizontal rectangle with SDS rounded corners - GLOBAL SIZE for all badges
        'rounded-sq-md flex flex-col justify-between transition-all duration-150 relative overflow-hidden',
        // Fixed global size for ALL achievement badges site-wide
        'min-w-[180px] h-[92px] px-3 py-2.5',
        // Micro-interactions
        'active:scale-[0.98]',
        // Ghost styling
        isGhost && 'border border-dashed border-white/60',
        // CSS token background for non-Grand Slam milestones
        useCssTokenBg && `bg-achievement-${cssToken}`,
        // Grand Slam special class
        isGrandSlam && 'grand-slam-card',
      )}
      style={{
        // Use inline style for Grand Slam gradient, regional cards, or locked states
        ...(!useCssTokenBg && !isGrandSlam ? {
          background: unlocked && !isGhost
            ? `linear-gradient(135deg, ${palette.bgLight}, ${palette.bgDark})`
            : palette.bgLocked,
        } : {}),
        // Grand Slam uses CSS class, but we set colors here for consistency
        ...(isGrandSlam ? {
          color: '#F9FAFB',
        } : {}),
        transform: isPrimary ? 'translateY(-2px)' : undefined,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.85 : 1),
        // Shadows
        boxShadow: isGrandSlam 
          ? '0 14px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.15)'
          : unlocked && !isGhost 
            ? '0 6px 20px rgba(15,23,42,0.10)' 
            : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Grand Slam gold border overlay */}
      {isGrandSlam && (
        <div 
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            border: '1.5px solid var(--achv-gold)',
            opacity: 0.75,
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
            backgroundColor: isGrandSlam 
              ? 'rgba(212,168,87,0.22)' 
              : unlocked 
                ? `${palette.accent}1F` 
                : 'rgba(148,163,184,0.12)' 
          }}
        >
          <Trophy 
            className={cn("w-3.5 h-3.5", isGrandSlam && "grand-slam-icon")}
            style={{ color: iconColor }} 
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden text-left">
          <div 
            className="font-semibold leading-tight truncate text-[13px]"
            style={{ color: textMainColor }}
          >
            {isMilestone ? `${threshold} Club` : title}
          </div>
          <div 
            className="text-[11px] truncate"
            style={{ color: textSubtleColor }}
          >
            {isMilestone ? clubName : subtitle}
          </div>
        </div>
      </div>

      {/* Bottom right: Status chip */}
      <div className="flex justify-end">
        <div 
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-sq-xs text-[10px] font-medium",
          )}
          style={{
            backgroundColor: isGrandSlam 
              ? 'rgba(212,168,87,0.25)' 
              : 'var(--achv-pill-bg)',
            color: isGrandSlam 
              ? '#F9FAFB' 
              : 'var(--achv-pill-text)',
          }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;