import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getTierPalette, 
  MILESTONE_THEMES,
  MilestoneTier,
} from '@/lib/globalAchievementMilestoneSystem';
import { getEmblemPath } from '@/lib/achievementEmblems';

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  // Handle hsl colors - return as-is with opacity adjustment
  if (hex.startsWith('hsl')) {
    return hex.replace(')', ` / ${alpha})`).replace('hsl(', 'hsla(');
  }
  // Handle hex colors
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Generate CSS filter to colorize emblem to match accent color
function getColorFilter(hex: string): string {
  // For locked state (slate)
  if (hex === '#94a3b8') return 'brightness(0)';
  
  // Parse hex to RGB
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'brightness(0)';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  // Convert to HSL for filter calculation
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60; break;
      case gNorm: h = ((bNorm - rNorm) / d + 2) * 60; break;
      case bNorm: h = ((rNorm - gNorm) / d + 4) * 60; break;
    }
  }
  
  // Generate filter to achieve target color
  const hueRotate = h - 180; // Base hue after invert is ~180
  const saturate = s * 100 * 5; // Amplify saturation
  const brightness = 0.5 + l * 0.5;
  
  return `brightness(0) saturate(100%) invert(${Math.round(l * 100)}%) sepia(50%) saturate(${Math.round(saturate)}%) hue-rotate(${Math.round(hueRotate)}deg) brightness(${brightness.toFixed(2)}) contrast(90%)`;
}

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
        isGhost && 'border-dashed border-slate-300'
      )}
      style={{
        // Same pill styling but with achievement-specific colors
        background: unlocked && !isGhost 
          ? hexToRgba(palette.accent, 0.15)
          : '#f1f5f9', // slate-100 for locked
        backdropFilter: unlocked && !isGhost ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: unlocked && !isGhost ? 'blur(8px)' : undefined,
        border: unlocked && !isGhost 
          ? `1px solid ${hexToRgba(palette.accent, 0.3)}`
          : '1px solid rgba(148, 163, 184, 0.3)',
        transform: isPrimary ? 'translateY(-2px)' : undefined,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.85 : 1),
      }}
    >
      {/* Background emblem - subtle watermark */}
      {emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
        className="pointer-events-none select-none absolute inset-y-0 right-0 h-full w-auto translate-x-4 scale-125 opacity-[0.12]"
        style={{ 
          filter: unlocked && !isGhost 
            ? getColorFilter(palette.accent)
            : 'brightness(0)',
        }}
        />
      )}

      {/* Ghost overlay */}
      {isGhost && (
        <div className="absolute inset-0 rounded-[inherit] bg-white/40 pointer-events-none" />
      )}

      {/* Top left: Trophy icon + Title/Subtitle */}
      <div className="flex items-start gap-2 relative z-10">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: unlocked && !isGhost ? hexToRgba(palette.accent, 0.2) : 'rgba(148,163,184,0.12)' 
          }}
        >
          <Trophy 
            className="w-3.5 h-3.5"
            style={{ color: unlocked && !isGhost ? palette.accent : '#94a3b8' }} 
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden text-left">
          <div 
            className="font-semibold leading-tight truncate text-[13px]"
            style={{ color: unlocked && !isGhost ? palette.accent : '#0f172a' }}
          >
            {isMilestone ? `${threshold} Club` : title}
          </div>
          <div 
            className="text-[11px] truncate"
            style={{ color: unlocked && !isGhost ? hexToRgba(palette.accent, 0.8) : '#64748b' }}
          >
            {isMilestone ? clubName : subtitle}
          </div>
        </div>
      </div>

      {/* Bottom right: Status chip */}
      <div className="flex justify-end relative z-10">
        <div 
          className="inline-flex items-center px-2 py-0.5 rounded-sq-xs text-[10px] font-medium"
          style={{
            backgroundColor: unlocked && !isGhost ? hexToRgba(palette.accent, 0.2) : 'rgba(148,163,184,0.2)',
            color: unlocked && !isGhost ? palette.accent : '#64748b'
          }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;
