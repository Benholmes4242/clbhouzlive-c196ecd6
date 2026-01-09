/**
 * EliteGameCard - Premium Achievement Card (EA/Strava Energy)
 * 
 * Canonical design based on the Global Elite 150 Club mock:
 * - Landscape rectangle with rounded corners
 * - Left-anchored hero badge (flat metallic coin/medallion)
 * - Tier-based visual escalation (color, glow, animation)
 * - Premium collectible game-reward aesthetic
 * 
 * Tier System:
 * - Entry (5/10/20): Clean, soft glow, bronze→silver→champagne
 * - Progression (50/100): Stronger glow, subtle animated gradient
 * - Elite (150/200): Rare feel, double-layer borders, aura
 * - Legendary (300/400): Mythic tier, animated edge, alive feel
 * 
 * Performance Rules:
 * - Animations OFF by default (enableAnimations=false in lists)
 * - Animations ON only in focus views (single card hero)
 * - Particles OFF everywhere except unlock moment + single-card hero
 * - CSS-only animations (no per-frame JS loops)
 * - Respects prefers-reduced-motion
 * - Memoized rendering
 * 
 * Also supports regional completion cards (GBI, EU, USA, WORLD)
 */

import React, { useMemo, memo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { cn } from '@/lib/utils';
import { MILESTONE_TAGLINES, REGION_TAGLINES } from '@/config/achievementTaglines';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Hook to respect prefers-reduced-motion - updates if user changes preference
 */
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for intersection-based visibility gating (only animate when visible)
 */
function useIsVisible(threshold = 0.4): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true); // fallback: assume visible
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type EliteCardTier = 
  | '5' | '10' | '20' | '50' | '100' | '150' | '200' | '300' | '400'
  | 'GBI' | 'EU' | 'USA' | 'WORLD';

export type CardQuality = 'low' | 'medium' | 'high';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER VISUAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface TierVisualConfig {
  // Badge (coin/medallion) styling
  badgeGradient: string;
  badgeGlow: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  // Card styling
  cardBg: string;
  cardBorder: string;
  cardGlow: string;
  // Text colors
  titleColor: string;
  clubLabelColor: string;
  descriptorColor: string;
  // Animation flags
  glowIntensity: number;
  hasAnimatedBorder: boolean;
  hasParticles: boolean;
  animationSpeed: number;
  // Unique effect type for each tier
  effectType: 'sunrise' | 'mist' | 'shimmer' | 'ember' | 'obsidian' | 'aurora' | 'crystal' | 'nebula' | 'divine' | 'emerald' | 'royal' | 'crimson' | 'cosmic';
}

// Base tier configs - stable references
const ENTRY_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.2, hasAnimatedBorder: false, hasParticles: false, animationSpeed: 0,
  titleColor: '#F5F5F0', clubLabelColor: '#E8DCC8', descriptorColor: '#A0A0A0',
};

const PROGRESSION_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.3, hasAnimatedBorder: true, hasParticles: false, animationSpeed: 12,
  titleColor: '#FFFFFF', clubLabelColor: '#FFE4A0', descriptorColor: '#B0B0B0',
};

const ELITE_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.4, hasAnimatedBorder: true, hasParticles: true, animationSpeed: 10,
  titleColor: '#FFFFFF', clubLabelColor: '#A8E6CF', descriptorColor: '#C0C0C0',
};

const LEGENDARY_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.5, hasAnimatedBorder: true, hasParticles: true, animationSpeed: 8,
  titleColor: '#FFFFFF', clubLabelColor: '#FFD700', descriptorColor: '#D0D0D0',
};

// Milestone tier configs - LIGHTER, MORE VIBRANT, UNIQUE THEMES
const MILESTONE_CONFIGS: Record<number, TierVisualConfig> = {
  // 5 CLUB - Warm Sunrise: Copper/peach tones, hopeful morning light
  5: {
    ...ENTRY_BASE as TierVisualConfig,
    effectType: 'sunrise',
    badgeGradient: 'linear-gradient(145deg, #D4A574 0%, #C08050 50%, #A06030 100%)',
    badgeGlow: 'rgba(220, 160, 100, 0.6)', badgeTextColor: '#FFF5E8', badgeBorderColor: '#E8B080',
    cardBg: 'linear-gradient(135deg, #2A2420 0%, #352D28 50%, #3D332C 100%)',
    cardBorder: 'linear-gradient(135deg, #E8B080 0%, #C08050 100%)', cardGlow: 'rgba(220, 160, 100, 0.35)',
  },
  // 10 CLUB - Cool Mist: Clean silver with morning dew/mist feel
  10: {
    ...ENTRY_BASE as TierVisualConfig,
    effectType: 'mist',
    badgeGradient: 'linear-gradient(145deg, #C8D0D8 0%, #A8B4C0 50%, #8898A8 100%)',
    badgeGlow: 'rgba(180, 200, 220, 0.6)', badgeTextColor: '#FFFFFF', badgeBorderColor: '#B8C8D8',
    cardBg: 'linear-gradient(135deg, #1E2428 0%, #2A3238 50%, #323C44 100%)',
    cardBorder: 'linear-gradient(135deg, #B8C8D8 0%, #8898A8 100%)', cardGlow: 'rgba(180, 200, 220, 0.35)',
  },
  // 20 CLUB - Golden Shimmer: Rich champagne gold, elegant
  20: {
    ...ENTRY_BASE as TierVisualConfig, glowIntensity: 0.25,
    effectType: 'shimmer',
    badgeGradient: 'linear-gradient(145deg, #F0D890 0%, #E5C158 50%, #D4AF37 100%)',
    badgeGlow: 'rgba(240, 210, 120, 0.65)', badgeTextColor: '#FFFAE0', badgeBorderColor: '#F5D870',
    cardBg: 'linear-gradient(135deg, #282418 0%, #342C1E 50%, #3C3424 100%)',
    cardBorder: 'linear-gradient(135deg, #F5D870 0%, #D4AF37 100%)', cardGlow: 'rgba(240, 210, 120, 0.4)',
  },
  // 50 CLUB - Warm Ember: Deep amber/whiskey with firelight
  50: {
    ...PROGRESSION_BASE as TierVisualConfig,
    effectType: 'ember',
    badgeGradient: 'linear-gradient(145deg, #FFB347 0%, #FF8C00 50%, #E07000 100%)',
    badgeGlow: 'rgba(255, 160, 60, 0.7)', badgeTextColor: '#FFF8E0', badgeBorderColor: '#FFB040',
    cardBg: 'linear-gradient(135deg, #2C2018 0%, #3A2A1E 50%, #443222 100%)',
    cardBorder: 'linear-gradient(135deg, #FFB040 0%, #E07000 100%)', cardGlow: 'rgba(255, 160, 60, 0.45)',
  },
  // 100 CLUB - Obsidian Prestige: Sleek black & gold, premium contrast
  100: {
    ...PROGRESSION_BASE as TierVisualConfig, glowIntensity: 0.35,
    effectType: 'obsidian',
    badgeGradient: 'linear-gradient(145deg, #2A2A2A 0%, #1A1A1A 50%, #0A0A0A 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.7)', badgeTextColor: '#FFD700', badgeBorderColor: '#D4AF37',
    cardBg: 'linear-gradient(135deg, #151515 0%, #1E1E1E 50%, #252525 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #AA8822 50%, #D4AF37 100%)', cardGlow: 'rgba(212, 175, 55, 0.5)',
  },
  // 150 CLUB - Aurora Emerald: Northern lights with emerald green
  150: {
    ...ELITE_BASE as TierVisualConfig,
    effectType: 'aurora',
    badgeGradient: 'linear-gradient(145deg, #50C878 0%, #2E8B57 50%, #228B22 100%)',
    badgeGlow: 'rgba(80, 200, 120, 0.75)', badgeTextColor: '#E0FFE8', badgeBorderColor: '#60D880',
    cardBg: 'linear-gradient(135deg, #0E1F18 0%, #162820 50%, #1E3428 100%)',
    cardBorder: 'linear-gradient(135deg, #60D880 0%, #2E8B57 100%)', cardGlow: 'rgba(80, 200, 120, 0.5)',
  },
  // 200 CLUB - Crystal Sapphire: Ice blue with crystalline shimmer
  200: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.45,
    effectType: 'crystal',
    badgeGradient: 'linear-gradient(145deg, #60A0E0 0%, #3080D0 50%, #2060A0 100%)',
    badgeGlow: 'rgba(100, 160, 240, 0.75)', badgeTextColor: '#E8F4FF', badgeBorderColor: '#70B0F0',
    cardBg: 'linear-gradient(135deg, #101828 0%, #182030 50%, #202838 100%)',
    cardBorder: 'linear-gradient(135deg, #70B0F0 0%, #3080D0 100%)', cardGlow: 'rgba(100, 160, 240, 0.5)',
  },
  // 300 CLUB - Royal Nebula: Deep purple with cosmic energy
  300: {
    ...LEGENDARY_BASE as TierVisualConfig,
    effectType: 'nebula',
    badgeGradient: 'linear-gradient(145deg, #B060D0 0%, #8040A0 50%, #602080 100%)',
    badgeGlow: 'rgba(160, 100, 200, 0.8)', badgeTextColor: '#F8E8FF', badgeBorderColor: '#C080E0',
    cardBg: 'linear-gradient(135deg, #1A1020 0%, #241830 50%, #2E2040 100%)',
    cardBorder: 'linear-gradient(135deg, #C080E0 0%, #8040A0 100%)', cardGlow: 'rgba(160, 100, 200, 0.55)',
  },
  // 400 CLUB - Divine Gold: Pure radiant gold with heavenly light
  400: {
    ...LEGENDARY_BASE as TierVisualConfig, glowIntensity: 0.6,
    effectType: 'divine',
    badgeGradient: 'linear-gradient(145deg, #FFE878 0%, #FFD700 30%, #F0C000 70%, #FFD700 100%)',
    badgeGlow: 'rgba(255, 220, 80, 0.85)', badgeTextColor: '#FFFEF0', badgeBorderColor: '#FFE040',
    cardBg: 'linear-gradient(135deg, #1E1A0E 0%, #2A2414 50%, #342C1A 100%)',
    cardBorder: 'linear-gradient(135deg, #FFE040 0%, #FFD700 50%, #FFE878 100%)', cardGlow: 'rgba(255, 220, 80, 0.6)',
  },
};

// Regional tier configs - unique themes for each region
const REGIONAL_CONFIGS: Record<string, TierVisualConfig> = {
  // GBI - Emerald Isle: Rich green with Celtic heritage feel
  GBI: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.4,
    effectType: 'emerald',
    badgeGradient: 'linear-gradient(145deg, #40A060 0%, #2E8B57 50%, #1E6040 100%)',
    badgeGlow: 'rgba(60, 160, 90, 0.7)', badgeTextColor: '#E0FFE8', badgeBorderColor: '#50B070',
    cardBg: 'linear-gradient(135deg, #0E1E14 0%, #162820 50%, #1E3428 100%)',
    cardBorder: 'linear-gradient(135deg, #50B070 0%, #2E8B57 100%)', cardGlow: 'rgba(60, 160, 90, 0.45)',
  },
  // EU - Royal Blue: Continental elegance with European flair
  EU: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.4,
    effectType: 'royal',
    badgeGradient: 'linear-gradient(145deg, #4080C0 0%, #2E5B9C 50%, #1E4080 100%)',
    badgeGlow: 'rgba(80, 130, 200, 0.7)', badgeTextColor: '#E8F0FF', badgeBorderColor: '#5090D0',
    cardBg: 'linear-gradient(135deg, #101820 0%, #182030 50%, #202838 100%)',
    cardBorder: 'linear-gradient(135deg, #5090D0 0%, #2E5B9C 100%)', cardGlow: 'rgba(80, 130, 200, 0.45)',
  },
  // USA - Crimson Spirit: Bold red with American confidence
  USA: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.4,
    effectType: 'crimson',
    badgeGradient: 'linear-gradient(145deg, #E04040 0%, #C02020 50%, #901010 100%)',
    badgeGlow: 'rgba(220, 80, 80, 0.7)', badgeTextColor: '#FFE8E8', badgeBorderColor: '#E05050',
    cardBg: 'linear-gradient(135deg, #201414 0%, #2C1A1A 50%, #382020 100%)',
    cardBorder: 'linear-gradient(135deg, #E05050 0%, #C02020 100%)', cardGlow: 'rgba(220, 80, 80, 0.45)',
  },
  // WORLD - Cosmic Infinity: Universal purple/gold with global prestige
  WORLD: {
    ...LEGENDARY_BASE as TierVisualConfig, glowIntensity: 0.5,
    effectType: 'cosmic',
    badgeGradient: 'linear-gradient(145deg, #8060C0 0%, #6040A0 50%, #402080 100%)',
    badgeGlow: 'rgba(130, 100, 200, 0.8)', badgeTextColor: '#F0E8FF', badgeBorderColor: '#9070D0',
    cardBg: 'linear-gradient(135deg, #141020 0%, #1C1830 50%, #242040 100%)',
    cardBorder: 'linear-gradient(135deg, #9070D0 0%, #FFD700 100%)', cardGlow: 'rgba(130, 100, 200, 0.55)',
  },
};

// Locked state config - desaturated 70%, badge hollow/etched, same layout
const LOCKED_CONFIG: TierVisualConfig = {
  effectType: 'mist',
  badgeGradient: 'linear-gradient(145deg, #3A3A40 0%, #252530 50%, #1A1A22 100%)',
  badgeGlow: 'rgba(80, 80, 95, 0.15)', badgeTextColor: '#5A5A68', badgeBorderColor: '#4A4A58',
  cardBg: 'linear-gradient(135deg, #151518 0%, #1E1E24 50%, #131316 100%)',
  cardBorder: 'linear-gradient(135deg, #3A3A45 0%, #4A4A58 100%)', cardGlow: 'rgba(80, 80, 95, 0.08)',
  titleColor: '#8A8A98', clubLabelColor: '#5A5A68', descriptorColor: '#4A4A58',
  glowIntensity: 0, hasAnimatedBorder: false, hasParticles: false, animationSpeed: 0,
};

// Club names
const CLUB_NAMES: Record<string, string> = {
  '5': 'Rookie Club', '10': 'Fairway Club', '20': 'Founders Club', '50': 'Heritage Club',
  '100': 'Century Club', '150': 'Global Elite', '200': 'Clubhouse Elite', '300': 'Club Champion', '400': 'World Master',
  'GBI': 'GB & Ireland', 'EU': 'Continental Europe', 'USA': 'USA Top 100', 'WORLD': 'Worldwide',
};

const CLUB_DESCRIPTORS: Record<string, string> = {
  '5': 'First steps', '10': 'Finding fairways', '20': 'Building legacy', '50': 'Proper pedigree',
  '100': 'Rare achievement', '150': 'Worldwide dominance', '200': 'Elite status', '300': 'Legendary', '400': 'Ultimate mastery',
  'GBI': 'Links mastery', 'EU': 'Continental conquest', 'USA': 'American dream', 'WORLD': 'Global domination',
};

// Regional icon helper - coin-style crests
function getRegionalIcon(tier: string, size: string = 'w-7 h-7'): React.ReactNode {
  const iconClass = cn(size, 'text-current drop-shadow-sm');
  switch (tier) {
    case 'GBI': return <FaLandmarkDome className={iconClass} />;
    case 'EU': return <GiEuropeanFlag className={iconClass} />;
    case 'USA': return <FaFlagUsa className={iconClass} />;
    case 'WORLD': return <GiWorld className={iconClass} />;
    default: return null;
  }
}

// Milestone tier resolver - maps any threshold to nearest defined tier
function resolveMilestoneConfig(threshold: number): TierVisualConfig {
  // Discrete tiers we support
  const tiers = [5, 10, 20, 50, 100, 150, 200, 300, 400];
  
  // Find exact match first
  if (MILESTONE_CONFIGS[threshold]) return MILESTONE_CONFIGS[threshold];
  
  // Bucket ranges: Entry (5-20), Progression (50-100), Elite (150-200), Legendary (300-400)
  if (threshold <= 20) return MILESTONE_CONFIGS[Math.max(5, ...tiers.filter(t => t <= threshold))];
  if (threshold <= 100) return MILESTONE_CONFIGS[Math.max(50, ...tiers.filter(t => t <= threshold && t >= 50))];
  if (threshold <= 200) return MILESTONE_CONFIGS[Math.max(150, ...tiers.filter(t => t <= threshold && t >= 150))];
  return MILESTONE_CONFIGS[Math.max(300, ...tiers.filter(t => t <= threshold && t >= 300))] || MILESTONE_CONFIGS[400];
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
  /** Target for progress (used for regional: played/total) */
  targetProgress?: number;
  /** Number of regions completed (for milestone cards) */
  regionsCompleted?: number;
  /** Compact mode for grids (simplified, same shape) */
  compact?: boolean;
  /** Enable animations (OFF by default for lists, ON for focus views) */
  enableAnimations?: boolean;
  /** Show as ghost/placeholder card */
  isGhost?: boolean;
  /** Quality mode: low (lists), medium (default), high (focus views) */
  quality?: CardQuality;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Override title */
  title?: string;
  /** Override subtitle */
  subtitle?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// ELITE GAME CARD COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const EliteGameCard: React.FC<EliteGameCardProps> = memo(({
  tier,
  earned,
  currentProgress = 0,
  targetProgress,
  regionsCompleted,
  compact = false,
  enableAnimations = false, // OFF by default for performance
  isGhost = false,
  quality = 'medium',
  className,
  onClick,
  title: titleOverride,
  subtitle: subtitleOverride,
}) => {
  // Hooks - must be called unconditionally
  const prefersReducedMotion = useReducedMotion();
  const [cardRef, isVisible] = useIsVisible(0.4);
  
  // Determine if this is a milestone or regional card
  const isRegional = ['GBI', 'EU', 'USA', 'WORLD'].includes(tier);
  const threshold = isRegional ? (targetProgress || 100) : parseInt(tier, 10);
  
  // Get tier config - using resolver for continuous tier support
  const earnedConfig = useMemo(() => {
    if (isRegional) return REGIONAL_CONFIGS[tier] || REGIONAL_CONFIGS['GBI'];
    return resolveMilestoneConfig(threshold);
  }, [tier, threshold, isRegional]);
  
  // Active config: earned uses full config, locked uses LOCKED_CONFIG
  const config = useMemo(() => {
    if (isGhost || !earned) return LOCKED_CONFIG;
    return earnedConfig;
  }, [earned, isGhost, earnedConfig]);
  
  // Locked tier config for subtle tier identity (tinted rim/progress)
  const lockedTierConfig = earnedConfig;
  
  // Get display text
  const clubName = titleOverride || CLUB_NAMES[tier] || `${tier} Club`;
  const descriptor = subtitleOverride || CLUB_DESCRIPTORS[tier] || 
    (isRegional ? REGION_TAGLINES?.[tier.toLowerCase()] : MILESTONE_TAGLINES?.[threshold]) || '';
  
  // Progress calculation
  const target = targetProgress || threshold;
  const progressPercent = earned ? 100 : Math.min(100, (currentProgress / target) * 100);
  const remaining = earned ? 0 : Math.max(0, target - currentProgress);
  
  // Animation states - respect reduced motion + quality mode + visibility
  const isLowQuality = quality === 'low';
  const isHighQuality = quality === 'high';
  const animationsAllowed = enableAnimations && !prefersReducedMotion && !isLowQuality && isVisible;
  const shouldAnimate = animationsAllowed && earned && !isGhost && config.animationSpeed > 0;
  const showParticles = shouldAnimate && config.hasParticles && isHighQuality;
  
  // Card dimensions based on compact mode
  const cardHeight = compact ? 'h-[72px]' : 'h-[100px]';
  const badgeSize = compact ? 'w-11 h-11' : 'w-[64px] h-[64px]';
  const numberSize = compact ? 'text-sm font-bold' : 'text-xl font-bold';
  
  // Hover states - only for earned cards
  const hoverProps = animationsAllowed && earned && !isGhost 
    ? { scale: 1.01, y: -1 } 
    : {};
  
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative rounded-xl overflow-hidden select-none w-full',
        cardHeight,
        onClick && 'cursor-pointer',
        isGhost && 'opacity-50',
        className
      )}
      style={{
        background: config.cardBg,
        boxShadow: earned && !isGhost 
          ? `0 0 30px ${config.cardGlow}, 0 0 60px ${config.cardGlow}50, 0 4px 20px rgba(0,0,0,0.4)` 
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
      onClick={onClick}
      initial={false}
      whileHover={hoverProps}
      whileTap={animationsAllowed && onClick ? { scale: 0.99 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* ═══ UNIQUE BACKGROUND EFFECTS - Different for each tier ═══ */}
      {earned && !isGhost && (
        <>
          {/* Primary ambient glow - warm and inviting */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse 140% 100% at 10% 50%, ${config.badgeGlow} 0%, transparent 50%),
                radial-gradient(ellipse 100% 100% at 90% 30%, ${config.cardGlow} 0%, transparent 40%)
              `,
              opacity: 0.7,
            }}
          />
          
          {/* SUNRISE effect - warm diagonal rays */}
          {config.effectType === 'sunrise' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255,200,150,0.3) 0%, transparent 40%),
                  linear-gradient(160deg, rgba(255,180,100,0.2) 10%, transparent 50%)
                `,
              }}
            />
          )}
          
          {/* MIST effect - soft horizontal layers */}
          {config.effectType === 'mist' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  linear-gradient(180deg, rgba(200,220,240,0.15) 0%, transparent 30%),
                  linear-gradient(0deg, rgba(180,200,220,0.1) 0%, transparent 40%)
                `,
              }}
            />
          )}
          
          {/* SHIMMER effect - diagonal golden streaks */}
          {config.effectType === 'shimmer' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  linear-gradient(120deg, transparent 20%, rgba(255,220,100,0.25) 40%, transparent 60%),
                  linear-gradient(60deg, transparent 30%, rgba(255,200,80,0.15) 50%, transparent 70%)
                `,
              }}
            />
          )}
          
          {/* EMBER effect - warm flickering glow */}
          {config.effectType === 'ember' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 80% 60% at 20% 60%, rgba(255,120,40,0.35) 0%, transparent 50%),
                  radial-gradient(ellipse 60% 80% at 70% 40%, rgba(255,80,20,0.2) 0%, transparent 40%)
                `,
              }}
            />
          )}
          
          {/* OBSIDIAN effect - sleek black with gold edges */}
          {config.effectType === 'obsidian' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  linear-gradient(135deg, rgba(212,175,55,0.15) 0%, transparent 20%),
                  linear-gradient(-45deg, rgba(212,175,55,0.15) 100%, transparent 80%),
                  radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)
                `,
              }}
            />
          )}
          
          {/* AURORA effect - flowing green waves */}
          {config.effectType === 'aurora' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  linear-gradient(170deg, rgba(80,200,120,0.4) 0%, transparent 30%),
                  linear-gradient(190deg, rgba(40,160,80,0.25) 20%, transparent 50%),
                  linear-gradient(160deg, transparent 40%, rgba(60,180,100,0.2) 60%, transparent 80%)
                `,
              }}
            />
          )}
          
          {/* CRYSTAL effect - icy blue facets */}
          {config.effectType === 'crystal' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  linear-gradient(120deg, rgba(150,200,255,0.35) 0%, transparent 25%),
                  linear-gradient(60deg, transparent 50%, rgba(100,180,255,0.25) 70%, transparent 85%),
                  linear-gradient(180deg, rgba(180,220,255,0.15) 0%, transparent 40%)
                `,
              }}
            />
          )}
          
          {/* NEBULA effect - cosmic purple swirls */}
          {config.effectType === 'nebula' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 100% 80% at 30% 30%, rgba(160,100,200,0.4) 0%, transparent 40%),
                  radial-gradient(ellipse 80% 100% at 70% 70%, rgba(120,80,180,0.3) 0%, transparent 40%),
                  linear-gradient(45deg, rgba(200,120,255,0.15) 0%, transparent 50%)
                `,
              }}
            />
          )}
          
          {/* DIVINE effect - heavenly golden rays */}
          {config.effectType === 'divine' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 120% 80% at 20% 50%, rgba(255,220,80,0.5) 0%, transparent 40%),
                  linear-gradient(30deg, transparent 0%, rgba(255,240,150,0.3) 20%, transparent 40%),
                  linear-gradient(-20deg, transparent 0%, rgba(255,230,100,0.25) 15%, transparent 35%)
                `,
              }}
            />
          )}
          
          {/* EMERALD effect - lush green depth */}
          {config.effectType === 'emerald' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 100% 100% at 25% 50%, rgba(60,160,90,0.45) 0%, transparent 45%),
                  linear-gradient(150deg, rgba(80,180,100,0.2) 0%, transparent 40%)
                `,
              }}
            />
          )}
          
          {/* ROYAL effect - majestic blue elegance */}
          {config.effectType === 'royal' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 100% 100% at 25% 50%, rgba(80,130,200,0.45) 0%, transparent 45%),
                  linear-gradient(135deg, rgba(100,150,220,0.2) 0%, transparent 30%)
                `,
              }}
            />
          )}
          
          {/* CRIMSON effect - bold red power */}
          {config.effectType === 'crimson' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 100% 100% at 25% 50%, rgba(220,80,80,0.45) 0%, transparent 45%),
                  linear-gradient(160deg, rgba(200,60,60,0.2) 0%, transparent 40%)
                `,
              }}
            />
          )}
          
          {/* COSMIC effect - universal purple/gold fusion */}
          {config.effectType === 'cosmic' && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 100% 80% at 30% 40%, rgba(130,100,200,0.45) 0%, transparent 40%),
                  radial-gradient(ellipse 60% 60% at 75% 60%, rgba(255,200,60,0.25) 0%, transparent 35%),
                  linear-gradient(45deg, rgba(160,120,220,0.15) 0%, transparent 50%)
                `,
              }}
            />
          )}
          
          {/* Sparkle particles - varied by effect type */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              backgroundImage: ['aurora', 'crystal', 'nebula', 'divine', 'cosmic'].includes(config.effectType)
                ? `
                  radial-gradient(2px 2px at 12% 18%, ${config.badgeBorderColor}90 0%, transparent 100%),
                  radial-gradient(1.5px 1.5px at 28% 52%, ${config.badgeBorderColor}70 0%, transparent 100%),
                  radial-gradient(2px 2px at 45% 15%, ${config.badgeBorderColor}80 0%, transparent 100%),
                  radial-gradient(1px 1px at 72% 72%, ${config.badgeBorderColor}60 0%, transparent 100%),
                  radial-gradient(2px 2px at 85% 38%, ${config.badgeBorderColor}75 0%, transparent 100%),
                  radial-gradient(1.5px 1.5px at 58% 45%, ${config.badgeBorderColor}50 0%, transparent 100%),
                  radial-gradient(1px 1px at 18% 78%, ${config.badgeBorderColor}55 0%, transparent 100%),
                  radial-gradient(1.5px 1.5px at 92% 62%, ${config.badgeBorderColor}65 0%, transparent 100%)
                `
                : `
                  radial-gradient(1.5px 1.5px at 15% 20%, rgba(255,255,255,0.5) 0%, transparent 100%),
                  radial-gradient(1px 1px at 35% 60%, rgba(255,255,255,0.35) 0%, transparent 100%),
                  radial-gradient(1px 1px at 65% 30%, rgba(255,255,255,0.4) 0%, transparent 100%),
                  radial-gradient(1px 1px at 85% 70%, rgba(255,255,255,0.3) 0%, transparent 100%)
                `,
            }}
          />
        </>
      )}
      
      {/* ═══ TOP SPECULAR HIGHLIGHT - Bright edge shine ═══ */}
      {earned && !isGhost && (
        <>
          {/* Sharp top edge highlight line */}
          <div 
            className="absolute inset-x-0 top-0 h-[2px] pointer-events-none rounded-t-xl"
            style={{
              background: `linear-gradient(90deg, transparent 5%, ${config.badgeBorderColor}90 20%, ${config.badgeBorderColor} 50%, ${config.badgeBorderColor}90 80%, transparent 95%)`,
            }}
          />
          {/* Soft glow below the edge */}
          <div 
            className="absolute inset-x-0 top-0 h-[30%] pointer-events-none rounded-t-xl"
            style={{
              background: `linear-gradient(180deg, ${config.badgeBorderColor}40 0%, ${config.badgeBorderColor}15 30%, transparent 100%)`,
            }}
          />
        </>
      )}
      
      {/* Subtle animated background pulse */}
      {shouldAnimate && !isLowQuality && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{ 
            background: `radial-gradient(ellipse at 20% 50%, ${config.badgeGlow}40 0%, transparent 50%)`,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: config.animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {/* Particles - visible in all modes */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ 
                left: `${12 + i * 15}%`, 
                top: `${20 + (i % 3) * 25}%`,
                width: i % 2 === 0 ? '2px' : '1.5px',
                height: i % 2 === 0 ? '2px' : '1.5px',
                background: `${config.badgeBorderColor}`,
                boxShadow: `0 0 4px ${config.badgeGlow}`,
              }}
              animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3 + i * 0.4, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}
      
      {/* ═══ GLOWING BORDER - Much more prominent ═══ */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: earned ? '1.5px' : '1px',
          background: earned && !isGhost ? config.cardBorder : LOCKED_CONFIG.cardBorder,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: earned ? 1 : 0.6,
        }}
      />
      {/* Border glow effect */}
      {earned && !isGhost && (
        <div
          className="absolute -inset-[1px] rounded-xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 8px ${config.badgeGlow}60, 0 0 12px ${config.badgeGlow}40`,
            opacity: threshold >= 150 ? 1 : 0.7,
          }}
        />
      )}
      
      {/* Border sweep animation */}
      {shouldAnimate && config.hasAnimatedBorder && isHighQuality && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
          style={{ 
            background: `linear-gradient(90deg, transparent 0%, ${config.badgeBorderColor} 50%, transparent 100%)`, 
            opacity: 0.25,
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
      )}
      
      {/* Content */}
      <div className={cn('relative z-10 h-full flex items-center gap-3', compact ? 'px-2.5' : 'px-3.5')}>
        {/* Badge with pedestal - coin on plinth style */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          {/* ═══ POWERFUL BADGE HALO - Visible, luminous, impressive ═══ */}
          {earned && !isGhost && (
            <>
              {/* Outer glow field - creates the "powered" atmosphere */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{ 
                  width: compact ? '80px' : '100px',
                  height: compact ? '80px' : '100px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, ${config.badgeGlow} 0%, ${config.badgeGlow}60 30%, transparent 70%)`, 
                  filter: threshold >= 150 ? 'blur(15px)' : threshold >= 50 ? 'blur(12px)' : 'blur(10px)',
                  opacity: threshold >= 150 ? 0.9 : threshold >= 50 ? 0.7 : 0.5,
                }}
              />
              {/* Mid glow - more concentrated */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{ 
                  width: compact ? '60px' : '75px',
                  height: compact ? '60px' : '75px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, ${config.badgeGlow} 0%, transparent 60%)`, 
                  filter: threshold >= 150 ? 'blur(8px)' : 'blur(6px)',
                  opacity: threshold >= 150 ? 1 : 0.8,
                }}
              />
              {/* Halo ring effect */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{ 
                  width: compact ? '70px' : '90px',
                  height: compact ? '70px' : '90px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, transparent 40%, ${config.badgeBorderColor}50 55%, ${config.badgeBorderColor}30 65%, transparent 75%)`, 
                  filter: 'blur(3px)',
                  opacity: threshold >= 150 ? 0.8 : threshold >= 50 ? 0.6 : 0.4,
                }}
              />
            </>
          )}
          
          {/* Coin/medallion badge */}
          <div
            className={cn('relative rounded-full flex items-center justify-center z-10', badgeSize)}
            style={{
              background: earned && !isGhost ? config.badgeGradient : LOCKED_CONFIG.badgeGradient,
              boxShadow: earned && !isGhost
                ? `inset 0 2px 6px rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.4)`
                : 'inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {/* Outer ring - premium coin rim */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ 
                border: `2px solid ${earned && !isGhost ? config.badgeBorderColor : lockedTierConfig?.badgeBorderColor || LOCKED_CONFIG.badgeBorderColor}`,
                opacity: earned && !isGhost ? 0.4 : 0.15,
              }}
            />
            {/* Inner rim - coin edge detail */}
            <div
              className="absolute inset-1.5 rounded-full pointer-events-none"
              style={{ 
                border: `1.5px solid ${earned && !isGhost ? config.badgeBorderColor : lockedTierConfig?.badgeBorderColor || LOCKED_CONFIG.badgeBorderColor}`, 
                opacity: earned && !isGhost ? 0.5 : 0.2,
              }}
            />
            
            {/* Badge content - large number */}
            {earned && !isGhost ? (
              isRegional ? (
                <div style={{ color: config.badgeTextColor }}>
                  {getRegionalIcon(tier, compact ? 'w-5 h-5' : 'w-7 h-7')}
                </div>
              ) : (
                <span 
                  className={cn(compact ? 'text-lg font-bold' : 'text-2xl font-bold', 'tracking-tight')} 
                  style={{ color: config.badgeTextColor, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
                >
                  {threshold}
                </span>
              )
            ) : (
              // Locked: show number faded, not lock icon
              <span 
                className={cn(compact ? 'text-lg font-bold' : 'text-2xl font-bold', 'tracking-tight')} 
                style={{ color: 'rgba(255,255,255,0.25)', textShadow: 'none' }}
              >
                {isRegional ? '?' : threshold}
              </span>
            )}
          </div>
          
          {/* Pedestal/plinth base - only visible on non-compact */}
          {!compact && (
            <div 
              className="relative -mt-1.5 w-full flex justify-center z-0"
              style={{ transform: 'perspective(100px) rotateX(5deg)' }}
            >
              {/* Pedestal top surface */}
              <div 
                className="h-2 rounded-b-sm"
                style={{
                  width: compact ? '80%' : '85%',
                  background: earned && !isGhost 
                    ? `linear-gradient(to bottom, ${config.badgeBorderColor}40 0%, rgba(0,0,0,0.5) 100%)`
                    : 'linear-gradient(to bottom, rgba(100,100,100,0.3) 0%, rgba(0,0,0,0.4) 100%)',
                  boxShadow: earned && !isGhost 
                    ? `0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 ${config.badgeBorderColor}30`
                    : '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          )}
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Title - always hero text, clear hierarchy */}
          <h3
            className={cn('font-semibold tracking-tight truncate', compact ? 'text-sm' : 'text-base')}
            style={{ color: earned && !isGhost ? config.titleColor : LOCKED_CONFIG.titleColor }}
          >
            {clubName}
          </h3>
          
          {/* Tier label + descriptor - never competes with title */}
          <div className={cn('flex items-center gap-1.5 mt-0.5', compact ? 'text-[9px]' : 'text-[10px]')}>
            <span 
              className="font-semibold uppercase tracking-wider" 
              style={{ color: earned && !isGhost ? config.clubLabelColor : LOCKED_CONFIG.clubLabelColor }}
            >
              {isRegional ? 'COMPLETE' : `${threshold} CLUB`}
            </span>
            {!compact && descriptor && (
              <>
                <span style={{ color: earned && !isGhost ? config.descriptorColor : LOCKED_CONFIG.descriptorColor }}>•</span>
                <span 
                  className="truncate" 
                  style={{ color: earned && !isGhost ? config.descriptorColor : LOCKED_CONFIG.descriptorColor }}
                >
                  {descriptor}
                </span>
              </>
            )}
          </div>
          
          {/* Data chips - courses/regions (not form field style) */}
          {!compact && (
            <div className="flex items-center gap-2 mt-1.5 text-[9px]">
              <div 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ color: earned && !isGhost ? config.titleColor : LOCKED_CONFIG.titleColor, fontWeight: 500 }}>
                  {earned ? target : currentProgress} / {target}
                </span>
                <span style={{ color: earned && !isGhost ? config.descriptorColor : LOCKED_CONFIG.descriptorColor }}>
                  Courses
                </span>
              </div>
              
              {regionsCompleted !== undefined && !isRegional && (
                <div 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" 
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span style={{ color: earned && !isGhost ? config.titleColor : LOCKED_CONFIG.titleColor, fontWeight: 500 }}>
                    {regionsCompleted}
                  </span>
                  <span style={{ color: earned && !isGhost ? config.descriptorColor : LOCKED_CONFIG.descriptorColor }}>
                    Regions
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Earned pill OR Progress bar (locked state) */}
          {!compact && (
            <div className="mt-1.5">
              {earned && !isGhost ? (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                  style={{ 
                    background: `${config.badgeGlow}`, 
                    border: `1px solid ${config.badgeBorderColor}30`, 
                    color: config.clubLabelColor,
                  }}
                >
                  <Check className="w-2.5 h-2.5" />
                  Earned
                </div>
              ) : (
                // Locked: show progress bar with remaining count
                <div className="flex items-center gap-2">
                  <div 
                    className="h-1 rounded-full overflow-hidden flex-1 max-w-[100px]" 
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ 
                        background: `linear-gradient(90deg, ${lockedTierConfig?.clubLabelColor || '#666'}50, ${lockedTierConfig?.badgeBorderColor || '#555'}50)`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[9px]" style={{ color: LOCKED_CONFIG.descriptorColor }}>
                    {remaining} to go
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Light streak for legendary tier - subtle */}
      {shouldAnimate && threshold >= 300 && isHighQuality && (
        <motion.div
          className="absolute w-[180%] h-px bg-gradient-to-r from-transparent via-white/8 to-transparent pointer-events-none"
          style={{ top: '35%', left: '-40%', transform: 'rotate(-12deg)' }}
          animate={{ x: ['-40%', '80%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear', repeatDelay: 5 }}
        />
      )}
    </motion.div>
  );
});

EliteGameCard.displayName = 'EliteGameCard';

export default EliteGameCard;
