/**
 * EliteGameCard - Premium Collector Achievement Card
 * 
 * Clean, warm design aligned with Hub design system:
 * - Light backgrounds with warm gradients
 * - Two variants: 'large' (journey map) and 'compact' (grids)
 * - Line art watermarks for premium collector feel
 * - Accent borders on earned cards
 * - Subtle radial gradients behind badges
 * 
 * Tier System (warm light colors):
 * - 5 Club: Warm copper/peach
 * - 10 Club: Cool silver/slate
 * - 20 Club: Classic gold
 * - 50 Club: Steel blue
 * - 100 Club: Premium black & gold
 * - 200 Club: Warm stone
 * - 300 Club: Royal violet
 * - 400 Club: Radiant amber/gold
 */

import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { cn } from '@/lib/utils';
import { MILESTONE_TAGLINES, REGION_TAGLINES } from '@/config/achievementTaglines';
import grandSlam400Image from '@/assets/achievements/grand-slam-400.png';
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type EliteCardTier = 
  | '5' | '10' | '20' | '50' | '100' | '150' | '200' | '300' | '400'
  | 'GBI' | 'EU' | 'USA' | 'WORLD';

export type CardVariant = 'large' | 'compact';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER VISUAL CONFIGURATION - WITH ACCENT COLORS & GLOW
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface TierVisualConfig {
  cardBg: string;
  cardBorder: string;
  badgeGradient: string;
  badgeGlow?: string;
  accentColor?: string;
  titleColor: string;
  subtitleColor: string;
  progressTrack: string;
  progressFill: string;
}

// Milestone tier configs - WARM, LIGHT, FRIENDLY with accent colors
const MILESTONE_CONFIGS: Record<number, TierVisualConfig> = {
  // 5 CLUB - Warm copper/peach
  5: {
    cardBg: 'linear-gradient(135deg, #FFFBF7 0%, #FFF5EB 100%)',
    cardBorder: '#E8D4C4',
    badgeGradient: 'linear-gradient(145deg, #D4A574 0%, #C08050 100%)',
    badgeGlow: 'rgba(212, 165, 116, 0.3)',
    accentColor: '#C08050',
    titleColor: '#92610A',
    subtitleColor: '#B8860B',
    progressTrack: '#F5E6D3',
    progressFill: '#D4A574',
  },
  
  // 10 CLUB - Cool silver/slate
  10: {
    cardBg: 'linear-gradient(135deg, #F8FAFA 0%, #F1F5F9 100%)',
    cardBorder: '#CBD5E1',
    badgeGradient: 'linear-gradient(145deg, #94A3B8 0%, #64748B 100%)',
    badgeGlow: 'rgba(148, 163, 184, 0.3)',
    accentColor: '#64748B',
    titleColor: '#475569',
    subtitleColor: '#64748B',
    progressTrack: '#E2E8F0',
    progressFill: '#94A3B8',
  },
  
  // 20 CLUB - Classic gold
  20: {
    cardBg: 'linear-gradient(135deg, #FFFDF5 0%, #FEF9E7 100%)',
    cardBorder: '#E8D888',
    badgeGradient: 'linear-gradient(145deg, #F0C850 0%, #D4AF37 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.35)',
    accentColor: '#D4AF37',
    titleColor: '#92740C',
    subtitleColor: '#B8960B',
    progressTrack: '#F5EED3',
    progressFill: '#D4AF37',
  },
  
  // 50 CLUB - Steel blue
  50: {
    cardBg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    cardBorder: '#94A3B8',
    badgeGradient: 'linear-gradient(145deg, #64748B 0%, #475569 100%)',
    badgeGlow: 'rgba(100, 116, 139, 0.25)',
    accentColor: '#475569',
    titleColor: '#334155',
    subtitleColor: '#475569',
    progressTrack: '#E2E8F0',
    progressFill: '#64748B',
  },
  
  // 100 CLUB - Premium black & gold
  100: {
    cardBg: 'linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)',
    cardBorder: '#D4AF37',
    badgeGradient: 'linear-gradient(145deg, #F0C850 0%, #D4AF37 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.4)',
    accentColor: '#D4AF37',
    titleColor: '#FFFFFF',
    subtitleColor: '#D4AF37',
    progressTrack: '#404040',
    progressFill: '#D4AF37',
  },
  
  // 150 CLUB - Emerald green
  150: {
    cardBg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    cardBorder: '#86EFAC',
    badgeGradient: 'linear-gradient(145deg, #4ADE80 0%, #22C55E 100%)',
    badgeGlow: 'rgba(74, 222, 128, 0.3)',
    accentColor: '#22C55E',
    titleColor: '#166534',
    subtitleColor: '#22C55E',
    progressTrack: '#D1FAE5',
    progressFill: '#22C55E',
  },
  
  // 200 CLUB - Warm stone
  200: {
    cardBg: 'linear-gradient(135deg, #FAF9F7 0%, #F5F3F0 100%)',
    cardBorder: '#D6D3D1',
    badgeGradient: 'linear-gradient(145deg, #A8A29E 0%, #78716C 100%)',
    badgeGlow: 'rgba(168, 162, 158, 0.25)',
    accentColor: '#78716C',
    titleColor: '#44403C',
    subtitleColor: '#57534E',
    progressTrack: '#E7E5E4',
    progressFill: '#78716C',
  },
  
  // 300 CLUB - Royal violet
  300: {
    cardBg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
    cardBorder: '#C4B5FD',
    badgeGradient: 'linear-gradient(145deg, #8B5CF6 0%, #7C3AED 100%)',
    badgeGlow: 'rgba(139, 92, 246, 0.3)',
    accentColor: '#7C3AED',
    titleColor: '#5B21B6',
    subtitleColor: '#7C3AED',
    progressTrack: '#EDE9FE',
    progressFill: '#8B5CF6',
  },
  
  // 400 CLUB - Radiant amber/gold
  400: {
    cardBg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    cardBorder: '#FCD34D',
    badgeGradient: 'linear-gradient(145deg, #FBBF24 0%, #F59E0B 100%)',
    badgeGlow: 'rgba(251, 191, 36, 0.35)',
    accentColor: '#F59E0B',
    titleColor: '#B45309',
    subtitleColor: '#D97706',
    progressTrack: '#FEF3C7',
    progressFill: '#F59E0B',
  },
};

// Regional tier configs - WARM LIGHT COLORS (for earned state)
const REGIONAL_CONFIGS: Record<string, TierVisualConfig> = {
  // GB & Ireland - Fresh green
  GBI: {
    cardBg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    cardBorder: '#86EFAC',
    badgeGradient: 'linear-gradient(145deg, #4ADE80 0%, #22C55E 100%)',
    badgeGlow: 'rgba(74, 222, 128, 0.3)',
    accentColor: '#22C55E',
    titleColor: '#166534',
    subtitleColor: '#22C55E',
    progressTrack: '#D1FAE5',
    progressFill: '#22C55E',
  },
  
  // Europe - Cool blue
  EU: {
    cardBg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    cardBorder: '#93C5FD',
    badgeGradient: 'linear-gradient(145deg, #60A5FA 0%, #3B82F6 100%)',
    badgeGlow: 'rgba(96, 165, 250, 0.3)',
    accentColor: '#3B82F6',
    titleColor: '#1E40AF',
    subtitleColor: '#3B82F6',
    progressTrack: '#DBEAFE',
    progressFill: '#3B82F6',
  },
  
  // USA - Heritage red
  USA: {
    cardBg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
    cardBorder: '#FCA5A5',
    badgeGradient: 'linear-gradient(145deg, #F87171 0%, #EF4444 100%)',
    badgeGlow: 'rgba(248, 113, 113, 0.3)',
    accentColor: '#EF4444',
    titleColor: '#B91C1C',
    subtitleColor: '#EF4444',
    progressTrack: '#FEE2E2',
    progressFill: '#EF4444',
  },
  
  // Worldwide - Royal purple
  WORLD: {
    cardBg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
    cardBorder: '#C4B5FD',
    badgeGradient: 'linear-gradient(145deg, #A78BFA 0%, #8B5CF6 100%)',
    badgeGlow: 'rgba(167, 139, 250, 0.3)',
    accentColor: '#8B5CF6',
    titleColor: '#6D28D9',
    subtitleColor: '#8B5CF6',
    progressTrack: '#EDE9FE',
    progressFill: '#8B5CF6',
  },
};

// Regional LOCKED configs - muted but visible colors
const REGIONAL_LOCKED_CONFIGS: Record<string, TierVisualConfig> = {
  GBI: {
    cardBg: 'linear-gradient(135deg, #F0FAF4 0%, #E8F5EC 100%)',
    cardBorder: '#C6E7D0',
    badgeGradient: 'linear-gradient(145deg, #A8D4B8 0%, #8BC4A0 100%)',
    badgeGlow: 'rgba(168, 212, 184, 0.2)',
    accentColor: '#8BC4A0',
    titleColor: '#64A078',
    subtitleColor: '#8AB89A',
    progressTrack: '#D1FAE5',
    progressFill: '#8BC4A0',
  },
  EU: {
    cardBg: 'linear-gradient(135deg, #EDF4FC 0%, #E4EEF8 100%)',
    cardBorder: '#C4D9F0',
    badgeGradient: 'linear-gradient(145deg, #A0C4E8 0%, #80B0D8 100%)',
    badgeGlow: 'rgba(160, 196, 232, 0.2)',
    accentColor: '#80B0D8',
    titleColor: '#5A8AC0',
    subtitleColor: '#7AA0D0',
    progressTrack: '#DBEAFE',
    progressFill: '#80B0D8',
  },
  USA: {
    cardBg: 'linear-gradient(135deg, #FCF0F0 0%, #F8E8E8 100%)',
    cardBorder: '#F0C8C8',
    badgeGradient: 'linear-gradient(145deg, #E8A8A8 0%, #D89090 100%)',
    badgeGlow: 'rgba(232, 168, 168, 0.2)',
    accentColor: '#D89090',
    titleColor: '#C07070',
    subtitleColor: '#D09090',
    progressTrack: '#FEE2E2',
    progressFill: '#D89090',
  },
  WORLD: {
    cardBg: 'linear-gradient(135deg, #F6F0FC 0%, #F0E8F8 100%)',
    cardBorder: '#DCC8F0',
    badgeGradient: 'linear-gradient(145deg, #C8A8E0 0%, #B890D0 100%)',
    badgeGlow: 'rgba(200, 168, 224, 0.2)',
    accentColor: '#B890D0',
    titleColor: '#9070B0',
    subtitleColor: '#A888C0',
    progressTrack: '#EDE9FE',
    progressFill: '#B890D0',
  },
};

// Locked state config - light, subtle appearance (for milestone cards)
// Phase 1: Added consistent border for all locked badges
const LOCKED_CONFIG: TierVisualConfig = {
  cardBg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
  cardBorder: '1px solid #E2E8F0', // Standardized border
  badgeGradient: 'linear-gradient(145deg, #E2E8F0 0%, #CBD5E1 100%)',
  badgeGlow: 'rgba(226, 232, 240, 0.2)',
  accentColor: '#CBD5E1',
  titleColor: '#94A3B8',
  subtitleColor: '#CBD5E1',
  progressTrack: '#E2E8F0',
  progressFill: '#CBD5E1',
};

// Phase 1: Standardized constants for visual consistency
const EARNED_CARD_SHADOW = '0 4px 12px rgba(180, 140, 100, 0.15)';
const CHECKMARK_SIZE = 'w-6 h-6'; // Standardized 24px
const CHECKMARK_ICON_SIZE = 'w-3.5 h-3.5'; // Inner icon
const LOCK_ICON_SIZE = 'w-5 h-5'; // Lock indicator

// ═══════════════════════════════════════════════════════════════════════════════════════════
// LINE ART ICONS FOR WATERMARKS
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface IconData {
  path: string;
  viewBox: string;
}

// Tier-specific line art icons
const TIER_ICONS: Record<number, IconData> = {
  5: {
    // Golf flag
    viewBox: "0 0 24 24",
    path: "M5 21V3M5 3L19 9L5 15",
  },
  10: {
    // Golf ball with motion lines
    viewBox: "0 0 24 24",
    path: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM2 12h3M19 12h3M12 2v3",
  },
  20: {
    // Laurel wreath
    viewBox: "0 0 24 24",
    path: "M12 3c-1.5 2-2 4-2 6s.5 4 2 6c1.5-2 2-4 2-6s-.5-4-2-6zM6 6c0 2 1 4 2.5 5.5M18 6c0 2-1 4-2.5 5.5M4 12c1 2 3 3.5 5 4M20 12c-1 2-3 3.5-5 4M8 18c1.5 1 2.5 1.5 4 1.5s2.5-.5 4-1.5",
  },
  50: {
    // Shield/crest
    viewBox: "0 0 24 24",
    path: "M12 2L3 7v6c0 5.5 3.8 10.3 9 11.5 5.2-1.2 9-6 9-11.5V7l-9-5z",
  },
  100: {
    // Star burst
    viewBox: "0 0 24 24",
    path: "M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 17l-6.3 4 2.3-7.2-6-4.4h7.6L12 2z",
  },
  150: {
    // Emerald gem
    viewBox: "0 0 24 24",
    path: "M12 2L4 8l8 14 8-14-8-6zM4 8h16",
  },
  200: {
    // Mountain peak
    viewBox: "0 0 24 24",
    path: "M12 4L2 20h20L12 4zM12 4v8M8 14l4-4 4 4",
  },
  300: {
    // Crown
    viewBox: "0 0 24 24",
    path: "M2 18h20v2H2v-2zM4 18l2-10 4 4 2-8 2 8 4-4 2 10H4z",
  },
  400: {
    // Globe with laurels
    viewBox: "0 0 24 24",
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c-3 3-3 7-3 10s0 7 3 10M12 2c3 3 3 7 3 10s0 7-3 10M5 5c2 1.5 4.5 2 7 2s5-.5 7-2M5 19c2-1.5 4.5-2 7-2s5 .5 7 2",
  },
};

// Regional icons
const REGIONAL_ICONS: Record<string, IconData> = {
  GBI: {
    // Castle/tower - British heritage
    viewBox: "0 0 24 24",
    path: "M4 21V10l2-2V4h2v2h2V4h2v2h2V4h2v4l2 2v11H4zM8 21v-4h3v4M13 21v-4h3v4",
  },
  EU: {
    // EU stars circle
    viewBox: "0 0 24 24",
    path: "M12 2l.6 1.8h1.9l-1.5 1.1.6 1.8-1.6-1.1-1.6 1.1.6-1.8-1.5-1.1h1.9L12 2zM4.2 8l.6 1.8h1.9l-1.5 1.1.6 1.8-1.6-1.1-1.6 1.1.6-1.8L2 9.8h1.9L4.2 8zM4.2 16l.6-1.8h1.9l-1.5-1.1.6-1.8-1.6 1.1-1.6-1.1.6 1.8L2 14.2h1.9l.3 1.8zM12 22l.6-1.8h1.9l-1.5-1.1.6-1.8-1.6 1.1-1.6-1.1.6 1.8-1.5 1.1h1.9L12 22zM19.8 16l-.6-1.8h-1.9l1.5-1.1-.6-1.8 1.6 1.1 1.6-1.1-.6 1.8 1.5 1.1h-1.9l-.6 1.8zM19.8 8l-.6 1.8h-1.9l1.5 1.1-.6 1.8 1.6-1.1 1.6 1.1-.6-1.8 1.5-1.1h-1.9L19.8 8z",
  },
  USA: {
    // Flag stripes simplified
    viewBox: "0 0 24 24",
    path: "M4 4h16v16H4V4zM4 7h16M4 10h16M4 13h16M4 16h16M4 4h8v8H4V4z",
  },
  WORLD: {
    // Globe
    viewBox: "0 0 24 24",
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  },
};

// Club names
const CLUB_NAMES: Record<string, string> = {
  '5': '5 Club', '10': '10 Club', '20': '20 Club', '50': '50 Club',
  '100': '100 Club', '150': '150 Club', '200': '200 Club', '300': '300 Club', '400': '400 Club',
  'GBI': 'GB&I', 'EU': 'Continental Europe', 'USA': 'USA Top 100', 'WORLD': 'Global',
};

const TIER_NAMES: Record<string, string> = {
  '5': 'Rookie Club', '10': 'Fairway Club', '20': 'Founders Club', '50': 'Heritage Club',
  '100': 'Century Club', '150': 'Global Elite', '200': 'Elite Club', '300': 'Legendary Club', '400': 'Grand Slam',
};

// Regional icon helper
function getRegionalIcon(tier: string, size: string = 'w-5 h-5'): React.ReactNode {
  const iconClass = cn(size, 'text-white');
  switch (tier) {
    case 'GBI': return <FaLandmarkDome className={iconClass} />;
    case 'EU': return <GiEuropeanFlag className={iconClass} />;
    case 'USA': return <FaFlagUsa className={iconClass} />;
    case 'WORLD': return <GiWorld className={iconClass} />;
    default: return null;
  }
}

// Milestone tier resolver
function resolveMilestoneConfig(threshold: number): TierVisualConfig {
  if (MILESTONE_CONFIGS[threshold]) return MILESTONE_CONFIGS[threshold];
  
  const tiers = [5, 10, 20, 50, 100, 150, 200, 300, 400];
  const closestTier = tiers.reduce((prev, curr) => 
    Math.abs(curr - threshold) < Math.abs(prev - threshold) ? curr : prev
  );
  return MILESTONE_CONFIGS[closestTier] || MILESTONE_CONFIGS[20];
}

// Get icon data for a tier
function getIconData(tier: string, isRegional: boolean, threshold: number): IconData | null {
  if (isRegional) {
    return REGIONAL_ICONS[tier] || null;
  }
  return TIER_ICONS[threshold] || null;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export interface EliteGameCardProps {
  /** Tier identifier (5-400 for milestones, GBI/EU/USA/WORLD for regions) */
  tier: EliteCardTier;
  /** Is this achievement earned? */
  earned: boolean;
  /** Current progress count */
  currentProgress?: number;
  /** Target for progress */
  targetProgress?: number;
  /** Number of regions completed (for milestone cards) */
  regionsCompleted?: number;
  /** Card variant: 'large' for journey map, 'compact' for grids */
  variant?: CardVariant;
  /** @deprecated Use variant instead */
  compact?: boolean;
  /** Enable animations (hover only) */
  enableAnimations?: boolean;
  /** Show as ghost/placeholder card */
  isGhost?: boolean;
  /** @deprecated Not used in new design */
  quality?: 'low' | 'medium' | 'high';
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Override title */
  title?: string;
  /** Override subtitle */
  subtitle?: string;
  /** Hide the card border (for hero contexts) */
  hideBorder?: boolean;
  /** Hide the earned checkmark */
  hideCheckmark?: boolean;
  /** Show minimal badge-only display (just the badge image, no card chrome) */
  minimalBadgeOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// ELITE GAME CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const EliteGameCard: React.FC<EliteGameCardProps> = memo(({
  tier,
  earned,
  currentProgress = 0,
  targetProgress,
  variant = 'large',
  compact = false,
  enableAnimations = true,
  isGhost = false,
  className,
  onClick,
  title: titleOverride,
  subtitle: subtitleOverride,
  hideBorder = false,
  hideCheckmark = false,
  minimalBadgeOnly = false,
}) => {
  // Determine variant from props (support legacy compact prop)
  const cardVariant: CardVariant = compact ? 'compact' : variant;
  const isCompact = cardVariant === 'compact';
  
  // Determine if this is a milestone or regional card
  const isRegional = ['GBI', 'EU', 'USA', 'WORLD'].includes(tier);
  const threshold = isRegional ? (targetProgress || 100) : parseInt(tier, 10);
  
  // Get tier config
  const earnedConfig = useMemo(() => {
    if (isRegional) return REGIONAL_CONFIGS[tier] || REGIONAL_CONFIGS['GBI'];
    return resolveMilestoneConfig(threshold);
  }, [tier, threshold, isRegional]);
  
  // Get locked config - use muted regional colors for regional cards
  const lockedConfig = useMemo(() => {
    if (isRegional) return REGIONAL_LOCKED_CONFIGS[tier] || LOCKED_CONFIG;
    return LOCKED_CONFIG;
  }, [tier, isRegional]);
  
  // Active config: earned uses full config, locked uses appropriate locked config
  const config = useMemo(() => {
    if (isGhost || !earned) return lockedConfig;
    return earnedConfig;
  }, [earned, isGhost, earnedConfig, lockedConfig]);
  
  // Get display text
  const displayName = titleOverride || CLUB_NAMES[tier] || `${tier} Club`;
  const tierName = TIER_NAMES[tier] || '';
  const subtitle = subtitleOverride || (isRegional ? REGION_TAGLINES?.[tier.toLowerCase()] : MILESTONE_TAGLINES?.[threshold]) || tierName;
  
  // Progress calculation
  const target = targetProgress || threshold;
  const progressPercent = earned ? 100 : Math.min(100, (currentProgress / target) * 100);
  const remaining = earned ? 0 : Math.max(0, target - currentProgress);
  
  // Determine if in progress (has some progress but not earned)
  const isInProgress = !earned && !isGhost && currentProgress > 0 && remaining > 0;
  
  // Hover and press animation props - Phase 3: Enhanced interactions
  const hoverProps = enableAnimations && !isGhost ? { scale: 1.02, y: -2 } : {};
  const tapProps = enableAnimations ? { scale: 0.98 } : {};
  
  // Get icon data for watermark
  const iconData = getIconData(tier, isRegional, threshold);
  
  // Watermark opacity based on state
  const watermarkOpacity = earned ? 0.07 : isGhost ? 0.03 : 0.05;
  
  // Check if this is a custom image tier
  const isGrandSlam = tier === '400';
  const isRookie = tier === '5';
  const isFairway = tier === '10';
  const isFounders = tier === '20';
  const isHeritage = tier === '50';
  const isCentury = tier === '100';
  const isElite = tier === '200';
  
  // Map tier to badge image
  const getBadgeImage = (tier: string): string | null => {
    const badgeMap: Record<string, string> = {
      '5': rookieBadgeImage,
      '10': fairwayBadgeImage,
      '20': foundersBadgeImage,
      '50': heritageBadgeImage,
      '100': centuryBadgeImage,
      '200': eliteBadgeImage,
      '300': legendaryBadgeImage,
      '400': grandSlam400Image,
    };
    return badgeMap[tier] || null;
  };
  
  const badgeImage = getBadgeImage(tier);
  const hasCustomBadge = !!badgeImage && !isRegional;
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // MINIMAL BADGE-ONLY VARIANT - Just the badge image, no card chrome
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (minimalBadgeOnly && badgeImage) {
    return (
      <motion.div
        className={cn(
          "relative flex items-center justify-center cursor-pointer",
          isGhost && "opacity-60",
          className
        )}
        style={{
          width: '80px',
          height: '80px',
        }}
        onClick={onClick}
        whileHover={enableAnimations ? { scale: 1.05 } : {}}
        whileTap={enableAnimations ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <img
          src={badgeImage}
          alt={`${tier} Club`}
          className="w-full h-full object-contain"
          style={{
            opacity: earned ? 1 : 0.4,
            filter: earned ? 'none' : 'grayscale(60%)',
          }}
        />
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // GRAND SLAM (400) COMPACT VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isCompact && isGrandSlam) {
    return (
      <motion.div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl cursor-pointer overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          minHeight: '140px',
          width: '100%',
          border: hideBorder ? 'none' : (earned ? '2px solid #F59E0B' : '1px solid rgba(0,0,0,0.1)'),
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Grand Slam badge image */}
        <img
          src={grandSlam400Image}
          alt="Grand Slam Club"
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            opacity: earned ? 1 : 0.4,
            filter: earned ? 'none' : 'grayscale(60%)',
          }}
        />
        
        {/* Overlay for locked state */}
        {!earned && !isGhost && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-4 h-4 text-[#64748b]" />
            </div>
          </div>
        )}
        
        {/* Earned checkmark */}
        {earned && !isGhost && !hideCheckmark && (
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-lg z-10">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // ROOKIE (5) COMPACT VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isCompact && isRookie) {
    return (
      <motion.div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl cursor-pointer overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          minHeight: '140px',
          width: '100%',
          border: hideBorder ? 'none' : (earned ? `2px solid ${earnedConfig.accentColor}` : '1px solid rgba(0,0,0,0.1)'),
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Rookie badge image */}
        <img
          src={rookieBadgeImage}
          alt="Rookie Club"
          className="absolute inset-0 w-full h-full object-contain p-2"
          style={{
            opacity: earned ? 1 : 0.4,
            filter: earned ? 'none' : 'grayscale(60%)',
          }}
        />
        
        {/* Overlay for locked state */}
        {!earned && !isGhost && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-4 h-4 text-[#64748b]" />
            </div>
          </div>
        )}
        
        {/* Earned checkmark */}
        {earned && !isGhost && !hideCheckmark && (
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-lg z-10">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // FAIRWAY (10) COMPACT VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isCompact && isFairway) {
    return (
      <motion.div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl cursor-pointer overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          minHeight: '140px',
          width: '100%',
          border: hideBorder ? 'none' : (earned ? `2px solid ${earnedConfig.accentColor}` : '1px solid rgba(0,0,0,0.1)'),
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Fairway badge image */}
        <img
          src={fairwayBadgeImage}
          alt="Fairway Club"
          className="absolute inset-0 w-full h-full object-contain p-2"
          style={{
            opacity: earned ? 1 : 0.4,
            filter: earned ? 'none' : 'grayscale(60%)',
          }}
        />
        
        {/* Overlay for locked state */}
        {!earned && !isGhost && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-4 h-4 text-[#64748b]" />
            </div>
          </div>
        )}
        
        {/* Earned checkmark */}
        {earned && !isGhost && !hideCheckmark && (
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-lg z-10">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // FOUNDERS (20) COMPACT VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isCompact && isFounders) {
    return (
      <motion.div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl cursor-pointer overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          minHeight: '140px',
          width: '100%',
          border: hideBorder ? 'none' : (earned ? `2px solid ${earnedConfig.accentColor}` : '1px solid rgba(0,0,0,0.1)'),
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Founders badge image */}
        <img
          src={foundersBadgeImage}
          alt="Founders Club"
          className="absolute inset-0 w-full h-full object-contain p-2"
          style={{
            opacity: earned ? 1 : 0.4,
            filter: earned ? 'none' : 'grayscale(60%)',
          }}
        />
        
        {/* Overlay for locked state */}
        {!earned && !isGhost && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-4 h-4 text-[#64748b]" />
            </div>
          </div>
        )}
        
        {/* Earned checkmark */}
        {earned && !isGhost && !hideCheckmark && (
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-lg z-10">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // COMPACT VARIANT
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isCompact) {
    return (
      <motion.div
        className={cn(
          "relative flex flex-col items-center justify-center p-3 rounded-xl text-center cursor-pointer overflow-hidden",
          isGhost && "opacity-60",
          !hideBorder && "border",
          !hideBorder && earned && "border-l-[3px]",
          className
        )}
        style={{
          background: config.cardBg,
          borderColor: hideBorder ? 'transparent' : config.cardBorder,
          borderLeftColor: hideBorder ? 'transparent' : (earned ? config.accentColor : config.cardBorder),
          minHeight: '90px',
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Subtle radial gradient behind badge */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${config.badgeGlow || 'transparent'} 0%, transparent 60%)`,
            opacity: 0.3,
          }}
        />
        
        {/* Line art watermark */}
        {iconData && (
          <svg
            className="absolute bottom-1 right-1 pointer-events-none"
            width="40"
            height="40"
            viewBox={iconData.viewBox}
            style={{ opacity: watermarkOpacity }}
          >
            <path
              d={iconData.path}
              fill="none"
              stroke={config.accentColor || config.titleColor}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        
        {/* Badge circle */}
        <div 
          className="relative w-9 h-9 rounded-full flex items-center justify-center mb-2 z-10"
          style={{ background: config.badgeGradient }}
        >
          {isRegional ? (
            getRegionalIcon(tier, 'w-4 h-4')
          ) : (
            <span className="text-white font-bold text-sm">{threshold}</span>
          )}
          
          {/* Earned checkmark */}
          {earned && !isGhost && !hideCheckmark && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          
          {/* Locked icon - improved visibility */}
          {!earned && !isGhost && (
            <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-2.5 h-2.5 text-[#64748b]" />
            </div>
          )}
        </div>
        
        {/* Label */}
        <span 
          className="text-xs font-semibold z-10"
          style={{ color: config.titleColor }}
        >
          {isRegional ? tier : `${threshold} Club`}
        </span>
        
        {/* Status */}
        {earned && !isGhost && (
          <span className="text-[10px] text-green-600 font-medium z-10">Unlocked</span>
        )}
        {isInProgress && (
          <span className="text-[10px] font-medium text-[#F7931E] z-10">In Progress</span>
        )}
        {!earned && !isGhost && !isInProgress && (
          <span className="text-[10px] z-10" style={{ color: config.subtitleColor }}>{remaining} to go</span>
        )}
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // GRAND SLAM (400) LARGE VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isGrandSlam) {
    return (
      <motion.div
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer w-full overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          background: earned 
            ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
            : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: hideBorder ? 'none' : (earned ? '2px solid #F59E0B' : '1px solid #E2E8F0'),
          boxShadow: earned ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.99 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Grand Slam badge image as left element */}
        <div className="relative flex-shrink-0 w-14 h-16 z-10">
          <img
            src={grandSlam400Image}
            alt="Grand Slam Club"
            className="w-full h-full object-contain"
            style={{
              opacity: earned ? 1 : 0.4,
              filter: earned ? 'none' : 'grayscale(60%)',
            }}
          />
          
          {/* Earned checkmark */}
          {earned && !isGhost && !hideCheckmark && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-sm">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          
          {/* Locked icon */}
          {!earned && !isGhost && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-3 h-3 text-[#64748b]" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 z-10">
          <h3 
            className="font-semibold text-base truncate"
            style={{ color: earned ? '#B45309' : '#94A3B8' }}
          >
            {displayName}
          </h3>
          <p 
            className="text-sm truncate"
            style={{ color: earned ? '#D97706' : '#CBD5E1' }}
          >
            {subtitle}
          </p>
          
          {/* Progress for in-progress cards */}
          {isInProgress && (
            <div className="mt-2 flex items-center gap-2">
              <div 
                className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[100px]"
                style={{ background: '#FEF3C7' }}
              >
                <motion.div
                  className="h-full rounded-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs text-amber-600">
                {currentProgress} / {target}
              </span>
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="flex-shrink-0 z-10">
          {earned && !isGhost && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Earned
            </span>
          )}
          {isInProgress && (
            <span className="text-xs font-medium text-[#F7931E]">
              {remaining} to go
            </span>
          )}
          {!earned && !isGhost && !isInProgress && (
            <span className="text-xs font-medium text-slate-500">
              {remaining} to go
            </span>
          )}
        </div>
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // ROOKIE (5) LARGE VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isRookie) {
    return (
      <motion.div
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer w-full overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          background: earned 
            ? earnedConfig.cardBg
            : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: hideBorder ? 'none' : (earned ? `2px solid ${earnedConfig.accentColor}` : '1px solid #E2E8F0'),
          boxShadow: earned ? `0 4px 12px ${earnedConfig.badgeGlow}` : '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.99 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Rookie badge image as left element */}
        <div className="relative flex-shrink-0 w-14 h-16 z-10">
          <img
            src={rookieBadgeImage}
            alt="Rookie Club"
            className="w-full h-full object-contain"
            style={{
              opacity: earned ? 1 : 0.4,
              filter: earned ? 'none' : 'grayscale(60%)',
            }}
          />
          
          {/* Earned checkmark */}
          {earned && !isGhost && !hideCheckmark && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-sm">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          
          {/* Locked icon */}
          {!earned && !isGhost && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-3 h-3 text-[#64748b]" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 z-10">
          <h3 
            className="font-semibold text-base truncate"
            style={{ color: earned ? earnedConfig.titleColor : '#94A3B8' }}
          >
            {displayName}
          </h3>
          <p 
            className="text-sm truncate"
            style={{ color: earned ? earnedConfig.subtitleColor : '#CBD5E1' }}
          >
            {subtitle}
          </p>
          
          {/* Progress for in-progress cards */}
          {isInProgress && (
            <div className="mt-2 flex items-center gap-2">
              <div 
                className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[100px]"
                style={{ background: earnedConfig.progressTrack }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: earnedConfig.progressFill }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs" style={{ color: earnedConfig.progressFill }}>
                {currentProgress} / {target}
              </span>
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="flex-shrink-0 z-10">
          {earned && !isGhost && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Earned
            </span>
          )}
          {isInProgress && (
            <span className="text-xs font-medium text-[#F7931E]">
              {remaining} to go
            </span>
          )}
          {!earned && !isGhost && !isInProgress && (
            <span className="text-xs font-medium text-slate-500">
              {remaining} to go
            </span>
          )}
        </div>
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // FAIRWAY (10) LARGE VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isFairway) {
    return (
      <motion.div
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer w-full overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          background: earned 
            ? earnedConfig.cardBg
            : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: hideBorder ? 'none' : (earned ? `2px solid ${earnedConfig.accentColor}` : '1px solid #E2E8F0'),
          boxShadow: earned ? `0 4px 12px ${earnedConfig.badgeGlow}` : '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.99 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Fairway badge image as left element */}
        <div className="relative flex-shrink-0 w-14 h-16 z-10">
          <img
            src={fairwayBadgeImage}
            alt="Fairway Club"
            className="w-full h-full object-contain"
            style={{
              opacity: earned ? 1 : 0.4,
              filter: earned ? 'none' : 'grayscale(60%)',
            }}
          />
          
          {/* Earned checkmark */}
          {earned && !isGhost && !hideCheckmark && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-sm">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          
          {/* Locked icon */}
          {!earned && !isGhost && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-3 h-3 text-[#64748b]" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 z-10">
          <h3 
            className="font-semibold text-base truncate"
            style={{ color: earned ? earnedConfig.titleColor : '#94A3B8' }}
          >
            {displayName}
          </h3>
          <p 
            className="text-sm truncate"
            style={{ color: earned ? earnedConfig.subtitleColor : '#CBD5E1' }}
          >
            {subtitle}
          </p>
          
          {/* Progress for in-progress cards */}
          {isInProgress && (
            <div className="mt-2 flex items-center gap-2">
              <div 
                className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[100px]"
                style={{ background: earnedConfig.progressTrack }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: earnedConfig.progressFill }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs" style={{ color: earnedConfig.progressFill }}>
                {currentProgress} / {target}
              </span>
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="flex-shrink-0 z-10">
          {earned && !isGhost && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Earned
            </span>
          )}
          {isInProgress && (
            <span className="text-xs font-medium text-[#F7931E]">
              {remaining} to go
            </span>
          )}
          {!earned && !isGhost && !isInProgress && (
            <span className="text-xs font-medium text-slate-500">
              {remaining} to go
            </span>
          )}
        </div>
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // FOUNDERS (20) LARGE VARIANT - Custom image-based card
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isFounders) {
    return (
      <motion.div
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer w-full overflow-hidden",
          isGhost && "opacity-60",
          className
        )}
        style={{
          background: earned 
            ? earnedConfig.cardBg
            : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: hideBorder ? 'none' : (earned ? `2px solid ${earnedConfig.accentColor}` : '1px solid #E2E8F0'),
          boxShadow: earned ? `0 4px 12px ${earnedConfig.badgeGlow}` : '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.99 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Founders badge image as left element */}
        <div className="relative flex-shrink-0 w-14 h-16 z-10">
          <img
            src={foundersBadgeImage}
            alt="Founders Club"
            className="w-full h-full object-contain"
            style={{
              opacity: earned ? 1 : 0.4,
              filter: earned ? 'none' : 'grayscale(60%)',
            }}
          />
          
          {/* Earned checkmark */}
          {earned && !isGhost && !hideCheckmark && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-sm">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          
          {/* Locked icon */}
          {!earned && !isGhost && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-3 h-3 text-[#64748b]" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 z-10">
          <h3 
            className="font-semibold text-base truncate"
            style={{ color: earned ? earnedConfig.titleColor : '#94A3B8' }}
          >
            {displayName}
          </h3>
          <p 
            className="text-sm truncate"
            style={{ color: earned ? earnedConfig.subtitleColor : '#CBD5E1' }}
          >
            {subtitle}
          </p>
          
          {/* Progress for in-progress cards */}
          {isInProgress && (
            <div className="mt-2 flex items-center gap-2">
              <div 
                className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[100px]"
                style={{ background: earnedConfig.progressTrack }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: earnedConfig.progressFill }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs" style={{ color: earnedConfig.progressFill }}>
                {currentProgress} / {target}
              </span>
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="flex-shrink-0 z-10">
          {earned && !isGhost && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Earned
            </span>
          )}
          {isInProgress && (
            <span className="text-xs font-medium text-[#F7931E]">
              {remaining} to go
            </span>
          )}
          {!earned && !isGhost && !isInProgress && (
            <span className="text-xs font-medium text-slate-500">
              {remaining} to go
            </span>
          )}
        </div>
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // LARGE VARIANT (Journey Map)
  // Phase 1: Standardized earned shadow, Phase 3: Press scale animation
  // ═══════════════════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-2xl border cursor-pointer w-full overflow-hidden",
        isGhost && "opacity-60",
        earned && "border-l-[4px]",
        isInProgress && "ring-2 ring-[#F7931E]/20",
        className
      )}
      style={{
        background: config.cardBg,
        borderColor: config.cardBorder,
        borderLeftColor: earned ? config.accentColor : config.cardBorder,
        // Phase 1: Standardized earned card shadow
        boxShadow: earned && !isGhost ? EARNED_CARD_SHADOW : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onClick={onClick}
      whileHover={hoverProps}
      // Phase 3: Press scale animation (150ms feel)
      whileTap={tapProps}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Subtle radial gradient behind badge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 15% 50%, ${config.badgeGlow || 'transparent'} 0%, transparent 50%)`,
          opacity: 0.25,
        }}
      />
      
      {/* Line art watermark */}
      {iconData && (
        <svg
          className="absolute bottom-2 right-4 pointer-events-none"
          width="72"
          height="72"
          viewBox={iconData.viewBox}
          style={{ opacity: watermarkOpacity }}
        >
          <path
            d={iconData.path}
            fill="none"
            stroke={config.accentColor || config.titleColor}
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      
      {/* Badge - image for milestone tiers, circle for regional */}
      {hasCustomBadge ? (
        <div className="relative flex-shrink-0 w-14 h-16 z-10">
          <img
            src={badgeImage}
            alt={`${displayName} badge`}
            className="w-full h-full object-contain"
            style={{
              opacity: earned ? 1 : 0.4,
              filter: earned ? 'none' : 'grayscale(60%)',
            }}
          />
          
          {/* Earned checkmark - Phase 1: Standardized 24px */}
          {earned && !isGhost && !hideCheckmark && (
            <div className={cn("absolute -bottom-1 -right-1 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-lg", CHECKMARK_SIZE)}>
              <Check className={cn("text-white", CHECKMARK_ICON_SIZE)} />
            </div>
          )}
          
          {/* Locked icon - Phase 1: Always present on locked badges */}
          {!earned && !isGhost && (
            <div className={cn("absolute -bottom-1 -right-1 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm", LOCK_ICON_SIZE)}>
              <Lock className="w-3 h-3 text-[#64748b]" />
            </div>
          )}
        </div>
      ) : (
        <div 
          className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10"
          style={{ background: config.badgeGradient }}
        >
          {isRegional ? (
            getRegionalIcon(tier, 'w-6 h-6')
          ) : (
            <span className="text-white font-bold text-lg">{threshold}</span>
          )}
          
          {/* Earned checkmark - Phase 1: Standardized 24px */}
          {earned && !isGhost && !hideCheckmark && (
            <div className={cn("absolute -bottom-1 -right-1 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-lg", CHECKMARK_SIZE)}>
              <Check className={cn("text-white", CHECKMARK_ICON_SIZE)} />
            </div>
          )}
          
          {/* Locked icon - Phase 1: Always present on locked badges */}
          {!earned && !isGhost && (
            <div className={cn("absolute -bottom-1 -right-1 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm", LOCK_ICON_SIZE)}>
              <Lock className="w-3 h-3 text-[#64748b]" />
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0 z-10">
        <h3 
          className="font-semibold text-base truncate"
          style={{ color: config.titleColor }}
        >
          {displayName}
        </h3>
        <p 
          className="text-sm truncate"
          style={{ color: config.subtitleColor }}
        >
          {subtitle}
        </p>
        
        {/* Progress for in-progress cards */}
        {isInProgress && (
          <div className="mt-2 flex items-center gap-2">
            <div 
              className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[100px]"
              style={{ background: config.progressTrack }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: config.progressFill }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs" style={{ color: config.subtitleColor }}>
              {currentProgress} / {target}
            </span>
          </div>
        )}
      </div>
      
      {/* Status badge */}
      <div className="flex-shrink-0 z-10">
        {earned && !isGhost && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            Earned
          </span>
        )}
        {isInProgress && (
          <span className="text-xs font-medium text-[#F7931E]">
            {remaining} to go
          </span>
        )}
        {!earned && !isGhost && !isInProgress && (
          <span className="text-xs font-medium text-slate-500">
            {remaining} to go
          </span>
        )}
      </div>
    </motion.div>
  );
});

EliteGameCard.displayName = 'EliteGameCard';

export default EliteGameCard;
