import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { cn } from '@/lib/utils';
import { ACHIEVEMENT_MILESTONES } from '@/config/achievements';
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
  'WORLD': 'WORLDWIDE',
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

// Collector micro-stamp labels
const MICRO_STAMPS: Record<string, string> = {
  '5': 'CLB · 5',
  '10': 'CLB · 10',
  '20': 'CLB · 20',
  '50': 'CLB · 50',
  '100': 'CLB · 100',
  '200': 'CLB · ELITE',
  '300': 'CLB · LEGEND',
  '400': 'CLB · SLAM',
  'GBI': 'CLB · GBI',
  'EU': 'CLB · EU',
  'USA': 'CLB · USA',
  'WORLD': 'CLB · WORLD',
};

// Glow intensity by tier - boosted so all tiers pop
// Base tier (Rookie → Century): matches previous Legendary/Grand Slam
// High tier (Elite → Legendary): +1 step stronger
// Top tier (Grand Slam): strongest premium glow
const GLOW_INTENSITY: Record<string, { opacity: number; scale: number; blur: number }> = {
  '5': { opacity: 0.14, scale: 2.6, blur: 6 },
  '10': { opacity: 0.14, scale: 2.6, blur: 6 },
  '20': { opacity: 0.15, scale: 2.7, blur: 7 },
  '50': { opacity: 0.15, scale: 2.7, blur: 7 },
  '100': { opacity: 0.16, scale: 2.8, blur: 8 },
  '200': { opacity: 0.18, scale: 3.0, blur: 9 },
  '300': { opacity: 0.22, scale: 3.2, blur: 10 },
  '400': { opacity: 0.26, scale: 3.5, blur: 12 },
  'GBI': { opacity: 0.14, scale: 2.6, blur: 6 },
  'EU': { opacity: 0.14, scale: 2.6, blur: 6 },
  'USA': { opacity: 0.14, scale: 2.6, blur: 6 },
  'WORLD': { opacity: 0.18, scale: 3.0, blur: 9 },
};

/**
 * MILESTONE_THRESHOLDS - Derived from the single source of truth.
 * Used for next tier calculation.
 */
const MILESTONE_THRESHOLDS: readonly number[] = ACHIEVEMENT_MILESTONES;

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

/**
 * Get the background icon for regional tiers (replaces emblem line art)
 */
function getRegionalBackgroundIcon(tier: string, accentColor: string): React.ReactNode | null {
  const iconClass = "w-20 h-20";
  const style = { color: accentColor, opacity: 0.08 };
  
  switch (tier) {
    case 'WORLD':
      return <GiWorld className={iconClass} style={style} />;
    case 'GBI':
      return <FaLandmarkDome className={iconClass} style={style} />;
    case 'USA':
      return <FaFlagUsa className={iconClass} style={style} />;
    case 'EU':
      return <GiEuropeanFlag className={iconClass} style={style} />;
    default:
      return null;
  }
}

/**
 * Desaturate a hex color slightly for subtle glow
 */
function desaturateColor(hex: string, amount: number = 0.2): string {
  // Simple desaturation by mixing with grey
  return hex; // Keep original for now - the low opacity handles subtlety
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
 * Collector / Rarity polish with:
 * - Trophy medallion with inner highlight/shadow (medal-like)
 * - Subtle rarity glow behind trophy (tier-weighted)
 * - Micro-stamp collector detail (bottom-right, engraved feel)
 * - Neutral glass base with corner accents
 * - Premium interaction polish (hover lift, glow tighten)
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
  const [isHovered, setIsHovered] = useState(false);
  
  const tierLabel = TIER_LABELS[tier] || tier;
  const clubName = CLUB_NAMES[tier] || title;
  const microStamp = MICRO_STAMPS[tier] || `CLB · ${tier}`;
  const emblemSrc = getEmblemPath(tier);
  const glowConfig = GLOW_INTENSITY[tier] || { opacity: 0.14, scale: 2.6, blur: 6 };
  
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

  // Interaction states
  const hoverLift = isHovered && unlocked && !isGhost ? 2 : 0;
  const glowScale = isHovered && unlocked && !isGhost ? 0.9 : 1;

  return (
    <div
      className={cn(
        // Glass card container with SDS rounded corners
        'rounded-sq-md flex flex-col justify-between transition-all duration-200 relative overflow-hidden',
        // Fixed global size for ALL achievement badges site-wide
        'min-w-[180px] h-[92px] px-3.5 py-3',
        // Micro-interactions
        'active:scale-[0.98]',
        unlocked && !isGhost && 'hover:shadow-lg',
        // Ghost styling
        isGhost && 'border border-dashed'
      )}
      style={{
        // Glass base - adapts to light/dark themes via CSS variables
        background: 'var(--achievement-card-bg, rgba(31, 36, 40, 0.04))',
        border: `1px solid var(--achievement-card-border, rgba(31, 36, 40, 0.08))`,
        backdropFilter: 'blur(12px)',
        transform: `translateY(-${hoverLift + (isPrimary ? 2 : 0)}px)`,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.75 : 1),
        boxShadow: unlocked && !isGhost 
          ? `0 ${2 + hoverLift}px ${12 + hoverLift * 2}px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)`
          : '0 1px 4px rgba(0, 0, 0, 0.03)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top edge inner highlight sheen - Apple-style premium feel */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 20%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.5) 80%, transparent 100%)',
          opacity: 0.7,
        }}
      />

      {/* Bottom-left corner accent - soft glassy blob */}
      <div 
        className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at bottom left, ${accentColor}${unlocked && !isGhost ? '20' : '10'} 0%, transparent 70%)`,
          borderBottomLeftRadius: 'inherit',
        }}
      />

      {/* Background emblem watermark - tier-colored at ~6% opacity */}
      {/* For regional cards, use icons instead of emblem line art */}
      {isRegional ? (
        <div 
          className="pointer-events-none select-none absolute inset-y-0 right-0 flex items-center justify-end pr-2 transition-transform duration-300"
          style={{ transform: `translateX(${isHovered ? -2 : 0}px)` }}
        >
          {getRegionalBackgroundIcon(tier, accentColor)}
        </div>
      ) : emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-y-0 right-0 h-full w-auto translate-x-4 scale-125 transition-transform duration-300"
          style={{ 
            opacity: 0.06,
            filter: unlocked && !isGhost 
              ? `brightness(0) saturate(100%)` 
              : 'brightness(0)',
            transform: `translateX(${16 + (isHovered ? -2 : 0)}px) scale(1.25)`,
          }}
        />
      )}

      {/* Ghost overlay */}
      {isGhost && (
        <div 
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{ background: 'var(--achievement-ghost-overlay, rgba(255, 255, 255, 0.15))' }}
        />
      )}

      {/* Micro-stamp collector detail - bottom right, engraved feel */}
      {unlocked && !isGhost && (
        <div 
          className="absolute bottom-2 right-2.5 pointer-events-none select-none"
          style={{
            fontSize: '7px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: accentColor,
            opacity: 0.12,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          {microStamp}
        </div>
      )}

      {/* Top row: Trophy icon + Title/Subtitle */}
      <div className="flex items-start gap-2.5 relative z-10">
        {/* Trophy medallion container with rarity glow */}
        <div className="relative flex-shrink-0">
          {/* Rarity glow - radial aura behind medallion - boosted for collectible feel */}
          {unlocked && !isGhost && (
            <div 
              className="absolute inset-0 pointer-events-none transition-transform duration-200"
              style={{
                background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}80 30%, transparent 70%)`,
                opacity: glowConfig.opacity * glowScale,
                transform: `scale(${glowConfig.scale * glowScale})`,
                filter: `blur(${glowConfig.blur}px)`,
              }}
            />
          )}
          
          {/* Medallion container - medal-like with inner highlight/shadow */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{ 
              backgroundColor: unlocked && !isGhost 
                ? `${accentColor}10` 
                : 'rgba(148, 163, 184, 0.06)',
              border: `1px solid ${unlocked && !isGhost ? `${accentColor}18` : 'rgba(148, 163, 184, 0.10)'}`,
              boxShadow: unlocked && !isGhost
                ? `inset 1px 1px 2px rgba(255,255,255,0.3), inset -1px -1px 2px ${accentColor}15`
                : 'inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Inner top-left highlight */}
            <div 
              className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at top left, rgba(255,255,255,0.4) 0%, transparent 70%)',
              }}
            />
            
            <Trophy 
              className="w-3.5 h-3.5 relative z-10"
              style={{ color: accentColor }} 
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden text-left">
          {/* Tier label - smaller, tighter tracking */}
          <div 
            className="font-semibold leading-tight truncate text-[11px] tracking-tight uppercase"
            style={{ color: accentColor }}
          >
            {tierLabel}
          </div>
          {/* Club name - primary label, clearer */}
          <div className="text-[12px] font-medium text-foreground/80 truncate mt-0.5">
            {isMilestone ? clubName : subtitle}
          </div>
        </div>
      </div>

      {/* Bottom row: Status chip - refined size and alignment */}
      <div className="flex justify-end relative z-10">
        <div 
          className="inline-flex items-center px-2 py-[3px] rounded-full text-[9px] font-medium tracking-wide transition-all duration-200"
          style={{
            backgroundColor: unlocked && !isGhost 
              ? `${accentColor}10` 
              : 'rgba(148, 163, 184, 0.08)',
            border: `1px solid ${unlocked && !isGhost 
              ? `${accentColor}20` 
              : 'rgba(148, 163, 184, 0.12)'}`,
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
