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
}

// Base tier configs - stable references
const ENTRY_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.12, hasAnimatedBorder: false, hasParticles: false, animationSpeed: 0,
  titleColor: '#E8E6E1', clubLabelColor: '#C9A94A', descriptorColor: '#9CA3AF',
};

const PROGRESSION_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.2, hasAnimatedBorder: true, hasParticles: false, animationSpeed: 12,
  titleColor: '#F5F5F0', clubLabelColor: '#D4AF37', descriptorColor: '#A1A7B0',
};

const ELITE_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.28, hasAnimatedBorder: true, hasParticles: true, animationSpeed: 10,
  titleColor: '#FFFFFF', clubLabelColor: '#E5C158', descriptorColor: '#B8BFC8',
};

const LEGENDARY_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.35, hasAnimatedBorder: true, hasParticles: true, animationSpeed: 8,
  titleColor: '#FFFFFF', clubLabelColor: '#F0D264', descriptorColor: '#C8CED6',
};

// Milestone tier configs - memoized at module level
const MILESTONE_CONFIGS: Record<number, TierVisualConfig> = {
  5: {
    ...ENTRY_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #9B8B72 0%, #7A6A55 50%, #5A4A38 100%)',
    badgeGlow: 'rgba(155, 139, 114, 0.35)', badgeTextColor: '#E8DCC8', badgeBorderColor: '#B09070',
    cardBg: 'linear-gradient(135deg, #1C1915 0%, #242220 50%, #1A1816 100%)',
    cardBorder: 'linear-gradient(135deg, #9B8B72 0%, #7A6A55 100%)', cardGlow: 'rgba(155, 139, 114, 0.15)',
  },
  10: {
    ...ENTRY_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #B8B8B8 0%, #909090 50%, #707070 100%)',
    badgeGlow: 'rgba(184, 184, 184, 0.35)', badgeTextColor: '#F0F0F0', badgeBorderColor: '#C0C0C0',
    cardBg: 'linear-gradient(135deg, #1A1A1C 0%, #222226 50%, #18181A 100%)',
    cardBorder: 'linear-gradient(135deg, #B8B8B8 0%, #808080 100%)', cardGlow: 'rgba(184, 184, 184, 0.15)',
  },
  20: {
    ...ENTRY_BASE as TierVisualConfig, glowIntensity: 0.15,
    badgeGradient: 'linear-gradient(145deg, #E5C158 0%, #D4AF37 50%, #B89B28 100%)',
    badgeGlow: 'rgba(229, 193, 88, 0.4)', badgeTextColor: '#FFFAE0', badgeBorderColor: '#F0D264',
    cardBg: 'linear-gradient(135deg, #1C1A15 0%, #252318 50%, #1A1815 100%)',
    cardBorder: 'linear-gradient(135deg, #E5C158 0%, #B89B28 100%)', cardGlow: 'rgba(229, 193, 88, 0.18)',
  },
  50: {
    ...PROGRESSION_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #FFD700 0%, #E5B800 50%, #CC9F00 100%)',
    badgeGlow: 'rgba(255, 215, 0, 0.45)', badgeTextColor: '#FFFAE0', badgeBorderColor: '#FFE55C',
    cardBg: 'linear-gradient(135deg, #1A1814 0%, #222016 50%, #181612 100%)',
    cardBorder: 'linear-gradient(135deg, #FFD700 0%, #CC9F00 100%)', cardGlow: 'rgba(255, 215, 0, 0.22)',
  },
  100: {
    ...PROGRESSION_BASE as TierVisualConfig, glowIntensity: 0.25,
    badgeGradient: 'linear-gradient(145deg, #1A1A1A 0%, #2D2D2D 50%, #0F0F0F 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.45)', badgeTextColor: '#D4AF37', badgeBorderColor: '#D4AF37',
    cardBg: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 50%, #0A0A0A 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #8B7355 100%)', cardGlow: 'rgba(212, 175, 55, 0.25)',
  },
  150: {
    ...ELITE_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #0D2820 0%, #143830 50%, #0A1C18 100%)',
    badgeGlow: 'rgba(34, 197, 94, 0.5)', badgeTextColor: '#A8E6CF', badgeBorderColor: '#22C55E',
    cardBg: 'linear-gradient(135deg, #0A1510 0%, #0F251A 50%, #081210 100%)',
    cardBorder: 'linear-gradient(135deg, #22C55E 0%, #D4AF37 100%)', cardGlow: 'rgba(34, 197, 94, 0.3)',
  },
  200: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.32,
    badgeGradient: 'linear-gradient(145deg, #0D1830 0%, #152848 50%, #0A1020 100%)',
    badgeGlow: 'rgba(59, 130, 246, 0.5)', badgeTextColor: '#93C5FD', badgeBorderColor: '#3B82F6',
    cardBg: 'linear-gradient(135deg, #0A0F18 0%, #101828 50%, #080C14 100%)',
    cardBorder: 'linear-gradient(135deg, #3B82F6 0%, #D4AF37 100%)', cardGlow: 'rgba(59, 130, 246, 0.3)',
  },
  300: {
    ...LEGENDARY_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #E5C158 0%, #D4AF37 50%, #C5A028 100%)',
    badgeGlow: 'rgba(229, 193, 88, 0.55)', badgeTextColor: '#FFFAE0', badgeBorderColor: '#F0D264',
    cardBg: 'linear-gradient(135deg, #141210 0%, #1E1A16 50%, #100E0C 100%)',
    cardBorder: 'linear-gradient(135deg, #E5C158 0%, #F0D264 100%)', cardGlow: 'rgba(229, 193, 88, 0.35)',
  },
  400: {
    ...LEGENDARY_BASE as TierVisualConfig, glowIntensity: 0.4,
    badgeGradient: 'linear-gradient(145deg, #F0E0B0 0%, #E5C158 30%, #D4AF37 70%, #E5C158 100%)',
    badgeGlow: 'rgba(240, 224, 176, 0.6)', badgeTextColor: '#FFF8E8', badgeBorderColor: '#F5E6C0',
    cardBg: 'linear-gradient(135deg, #18140E 0%, #221C14 50%, #14100A 100%)',
    cardBorder: 'linear-gradient(135deg, #F0E0B0 0%, #E5C158 50%, #F5E6C0 100%)', cardGlow: 'rgba(240, 224, 176, 0.4)',
  },
};

// Regional tier configs - first-class visual treatment matching milestone cards
const REGIONAL_CONFIGS: Record<string, TierVisualConfig> = {
  GBI: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.25,
    badgeGradient: 'linear-gradient(145deg, #0D2818 0%, #143820 50%, #0A1C10 100%)',
    badgeGlow: 'rgba(74, 124, 89, 0.5)', badgeTextColor: '#A8D5B8', badgeBorderColor: '#4A7C59',
    cardBg: 'linear-gradient(135deg, #0A1812 0%, #0F2518 50%, #081410 100%)',
    cardBorder: 'linear-gradient(135deg, #4A7C59 0%, #3A6449 100%)', cardGlow: 'rgba(74, 124, 89, 0.28)',
  },
  EU: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.25,
    badgeGradient: 'linear-gradient(145deg, #0D1838 0%, #152850 50%, #0A1028 100%)',
    badgeGlow: 'rgba(91, 126, 192, 0.5)', badgeTextColor: '#B8C8E8', badgeBorderColor: '#5B7EC0',
    cardBg: 'linear-gradient(135deg, #0A1018 0%, #101825 50%, #080C14 100%)',
    cardBorder: 'linear-gradient(135deg, #5B7EC0 0%, #4A6AA0 100%)', cardGlow: 'rgba(91, 126, 192, 0.28)',
  },
  USA: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.25,
    badgeGradient: 'linear-gradient(145deg, #301818 0%, #402828 50%, #200A0A 100%)',
    badgeGlow: 'rgba(199, 91, 91, 0.5)', badgeTextColor: '#F0C0C0', badgeBorderColor: '#C75B5B',
    cardBg: 'linear-gradient(135deg, #1A1012 0%, #251518 50%, #140A0C 100%)',
    cardBorder: 'linear-gradient(135deg, #C75B5B 0%, #A04848 100%)', cardGlow: 'rgba(199, 91, 91, 0.28)',
  },
  WORLD: {
    ...LEGENDARY_BASE as TierVisualConfig, glowIntensity: 0.35,
    badgeGradient: 'linear-gradient(145deg, #1A1838 0%, #282548 50%, #141028 100%)',
    badgeGlow: 'rgba(122, 143, 192, 0.55)', badgeTextColor: '#D0D8F0', badgeBorderColor: '#7A8FC0',
    cardBg: 'linear-gradient(135deg, #101018 0%, #181825 50%, #0C0C14 100%)',
    cardBorder: 'linear-gradient(135deg, #7A8FC0 0%, #D4AF37 100%)', cardGlow: 'rgba(122, 143, 192, 0.35)',
  },
};

// Locked state config - desaturated 70%, badge hollow/etched, same layout
const LOCKED_CONFIG: TierVisualConfig = {
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
          ? `0 0 16px ${config.cardGlow}, 0 3px 12px rgba(0,0,0,0.25)` 
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
      onClick={onClick}
      initial={false}
      whileHover={hoverProps}
      whileTap={animationsAllowed && onClick ? { scale: 0.99 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* ═══ CHANGE 1: Atmosphere Layer - Nebula/depth for ALL earned cards ═══ */}
      {earned && !isGhost && !isLowQuality && (
        <>
          {/* Deep space gradient base - intensity scales with tier */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: `
                radial-gradient(ellipse 120% 80% at 20% 50%, ${config.badgeGlow} 0%, transparent 50%),
                radial-gradient(ellipse 80% 100% at 80% 30%, ${config.cardGlow} 0%, transparent 40%),
                radial-gradient(ellipse 60% 60% at 60% 70%, rgba(255,255,255,0.03) 0%, transparent 50%)
              `,
              opacity: threshold >= 300 ? 0.35 : threshold >= 150 ? 0.25 : threshold >= 50 ? 0.18 : 0.12,
            }}
          />
          {/* Star dust particles - static CSS, scales with tier */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              backgroundImage: `
                radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.25) 0%, transparent 100%),
                radial-gradient(1px 1px at 25% 60%, rgba(255,255,255,0.18) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 45% 15%, rgba(255,255,255,0.2) 0%, transparent 100%),
                radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.15) 0%, transparent 100%),
                radial-gradient(1px 1px at 85% 40%, rgba(255,255,255,0.18) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 55% 45%, rgba(255,255,255,0.12) 0%, transparent 100%),
                radial-gradient(0.5px 0.5px at 30% 35%, rgba(255,255,255,0.2) 0%, transparent 100%),
                radial-gradient(0.5px 0.5px at 65% 25%, rgba(255,255,255,0.15) 0%, transparent 100%)
              `,
              opacity: threshold >= 300 ? 1 : threshold >= 150 ? 0.85 : threshold >= 50 ? 0.65 : 0.5,
            }}
          />
        </>
      )}
      
      {/* ═══ CHANGE 2: Glass Sheen - Top edge highlight for glossy look ═══ */}
      {earned && !isGhost && !isLowQuality && (
        <div 
          className="absolute inset-x-0 top-0 h-[45%] pointer-events-none rounded-t-xl"
          style={{
            background: threshold >= 150 
              ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 40%, transparent 100%)',
          }}
        />
      )}
      
      {/* Subtle animated background gradient (CSS-only style, framer for perf) */}
      {shouldAnimate && !isLowQuality && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: 'radial-gradient(ellipse at 25% 50%, rgba(255,255,255,0.02) 0%, transparent 50%)',
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: config.animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {/* Particles - ONLY in high quality mode for focus views */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-white/15"
              style={{ left: `${20 + i * 18}%`, top: `${30 + (i % 2) * 25}%` }}
              animate={{ y: [0, -6, 0], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 4 + i * 0.5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}
      
      {/* Border - static, premium */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: '1px',
          background: earned && !isGhost ? config.cardBorder : LOCKED_CONFIG.cardBorder,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: earned ? 1 : 0.7,
        }}
      />
      
      {/* Border sweep animation - subtle, only on earned + high quality */}
      {shouldAnimate && config.hasAnimatedBorder && isHighQuality && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ 
            background: `linear-gradient(90deg, transparent 0%, ${config.badgeGlow} 50%, transparent 100%)`, 
            opacity: 0.15,
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        />
      )}
      
      {/* Content */}
      <div className={cn('relative z-10 h-full flex items-center gap-3', compact ? 'px-2.5' : 'px-3.5')}>
        {/* Badge with pedestal - coin on plinth style */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          {/* ═══ CHANGE 3: Enhanced Badge Halo - ALL tiers get glow, Elite+ gets extra ═══ */}
          {earned && !isGhost && !isLowQuality && (
            <>
              {/* Primary glow - all tiers, intensity scales */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ 
                  background: `radial-gradient(circle, ${config.badgeGlow} 0%, transparent 60%)`, 
                  transform: threshold >= 150 ? 'scale(2.4)' : threshold >= 50 ? 'scale(2.0)' : 'scale(1.8)', 
                  filter: threshold >= 150 ? 'blur(12px)' : threshold >= 50 ? 'blur(8px)' : 'blur(6px)',
                  opacity: threshold >= 150 ? config.glowIntensity * 1.6 : threshold >= 50 ? config.glowIntensity * 1.3 : config.glowIntensity * 1.1,
                  top: '-10%',
                }}
              />
              {/* Secondary halo ring - 50+ tiers */}
              {threshold >= 50 && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ 
                    background: `radial-gradient(circle, transparent 45%, ${config.badgeGlow} 65%, transparent 85%)`, 
                    transform: threshold >= 150 ? 'scale(2.8)' : 'scale(2.3)', 
                    filter: 'blur(5px)',
                    opacity: threshold >= 300 ? 0.5 : threshold >= 150 ? 0.4 : 0.25,
                    top: '-10%',
                  }}
                />
              )}
              {/* Tertiary outer ring - Elite+ only for that "powered" look */}
              {threshold >= 150 && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ 
                    background: `radial-gradient(circle, transparent 60%, ${config.badgeGlow}30 80%, transparent 95%)`, 
                    transform: 'scale(3.2)', 
                    filter: 'blur(8px)',
                    opacity: threshold >= 300 ? 0.4 : 0.25,
                    top: '-10%',
                  }}
                />
              )}
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
