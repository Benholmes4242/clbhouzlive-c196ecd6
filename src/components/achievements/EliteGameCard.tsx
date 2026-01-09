/**
 * EliteGameCard - Premium Achievement Card (EA/Strava Energy)
 * 
 * Canonical design based on the Global Elite 150 Club mock:
 * - Landscape rectangle with rounded corners
 * - Left-anchored hero badge (large metallic medallion)
 * - Tier-based visual escalation (color, glow, animation)
 * - Premium collectible game-reward aesthetic
 * 
 * Tier System:
 * - Entry (5/10/20): Clean, soft glow, bronze→silver→champagne
 * - Progression (50/100): Stronger glow, animated gradient
 * - Elite (150/200): Rare feel, double-layer borders, aura
 * - Legendary (300/400): Mythic tier, animated neon edge, alive feel
 * 
 * Also supports regional completion cards (GBI, EU, USA, WORLD)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Globe, MapPin } from 'lucide-react';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { cn } from '@/lib/utils';
import { getMilestoneMetaByThreshold } from '@/config/achievements';
import { MILESTONE_TAGLINES, REGION_TAGLINES, REGION_FULL_NAMES } from '@/config/achievementTaglines';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type EliteCardTier = 
  | '5' | '10' | '20' | '50' | '100' | '150' | '200' | '300' | '400'
  | 'GBI' | 'EU' | 'USA' | 'WORLD';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER VISUAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface TierVisualConfig {
  badgeGradient: string;
  badgeGlow: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  cardBg: string;
  cardBorder: string;
  cardGlow: string;
  titleColor: string;
  clubLabelColor: string;
  descriptorColor: string;
  glowIntensity: number;
  hasAnimatedBorder: boolean;
  hasParticles: boolean;
  animationSpeed: number;
}

// Base tier configs
const ENTRY_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.15, hasAnimatedBorder: false, hasParticles: false, animationSpeed: 0,
  titleColor: '#E8E6E1', clubLabelColor: '#C9A94A', descriptorColor: '#9CA3AF',
};

const PROGRESSION_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.25, hasAnimatedBorder: true, hasParticles: true, animationSpeed: 10,
  titleColor: '#F5F5F0', clubLabelColor: '#D4AF37', descriptorColor: '#A1A7B0',
};

const ELITE_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.35, hasAnimatedBorder: true, hasParticles: true, animationSpeed: 8,
  titleColor: '#FFFFFF', clubLabelColor: '#E5C158', descriptorColor: '#B8BFC8',
};

const LEGENDARY_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.45, hasAnimatedBorder: true, hasParticles: true, animationSpeed: 6,
  titleColor: '#FFFFFF', clubLabelColor: '#F0D264', descriptorColor: '#C8CED6',
};

// Milestone tier configs
const MILESTONE_CONFIGS: Record<number, TierVisualConfig> = {
  5: {
    ...ENTRY_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #4A3728 100%)',
    badgeGlow: 'rgba(139, 115, 85, 0.4)', badgeTextColor: '#D4C4B0', badgeBorderColor: '#A08060',
    cardBg: 'linear-gradient(135deg, #1C1915 0%, #252220 50%, #1A1816 100%)',
    cardBorder: 'linear-gradient(135deg, #8B7355 0%, #6B5344 100%)', cardGlow: 'rgba(139, 115, 85, 0.2)',
  },
  10: {
    ...ENTRY_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #A8A8A8 0%, #808080 50%, #606060 100%)',
    badgeGlow: 'rgba(168, 168, 168, 0.4)', badgeTextColor: '#E0E0E0', badgeBorderColor: '#B0B0B0',
    cardBg: 'linear-gradient(135deg, #1A1A1C 0%, #222226 50%, #18181A 100%)',
    cardBorder: 'linear-gradient(135deg, #A8A8A8 0%, #707070 100%)', cardGlow: 'rgba(168, 168, 168, 0.2)',
  },
  20: {
    ...ENTRY_BASE as TierVisualConfig, glowIntensity: 0.18,
    badgeGradient: 'linear-gradient(145deg, #D4AF37 0%, #C5A028 50%, #A08020 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.4)', badgeTextColor: '#FFF8E0', badgeBorderColor: '#E5C158',
    cardBg: 'linear-gradient(135deg, #1C1A15 0%, #252318 50%, #1A1815 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #A08020 100%)', cardGlow: 'rgba(212, 175, 55, 0.25)',
  },
  50: {
    ...PROGRESSION_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #FFD700 0%, #DAA520 50%, #B8860B 100%)',
    badgeGlow: 'rgba(255, 215, 0, 0.5)', badgeTextColor: '#FFFAE0', badgeBorderColor: '#FFE55C',
    cardBg: 'linear-gradient(135deg, #1A1814 0%, #222016 50%, #181612 100%)',
    cardBorder: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', cardGlow: 'rgba(255, 215, 0, 0.3)',
  },
  100: {
    ...PROGRESSION_BASE as TierVisualConfig, glowIntensity: 0.3,
    badgeGradient: 'linear-gradient(145deg, #1A1A1A 0%, #2D2D2D 50%, #0A0A0A 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.5)', badgeTextColor: '#D4AF37', badgeBorderColor: '#D4AF37',
    cardBg: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 50%, #0A0A0A 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #8B7355 100%)', cardGlow: 'rgba(212, 175, 55, 0.35)',
  },
  150: {
    ...ELITE_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #0A2018 0%, #0F3025 50%, #081810 100%)',
    badgeGlow: 'rgba(34, 197, 94, 0.6)', badgeTextColor: '#A8E6CF', badgeBorderColor: '#22C55E',
    cardBg: 'linear-gradient(135deg, #0A1510 0%, #0F251A 50%, #081210 100%)',
    cardBorder: 'linear-gradient(135deg, #22C55E 0%, #D4AF37 100%)', cardGlow: 'rgba(34, 197, 94, 0.4)',
  },
  200: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.4,
    badgeGradient: 'linear-gradient(145deg, #0A1525 0%, #102040 50%, #081020 100%)',
    badgeGlow: 'rgba(59, 130, 246, 0.6)', badgeTextColor: '#93C5FD', badgeBorderColor: '#3B82F6',
    cardBg: 'linear-gradient(135deg, #0A0F18 0%, #101828 50%, #080C14 100%)',
    cardBorder: 'linear-gradient(135deg, #3B82F6 0%, #D4AF37 100%)', cardGlow: 'rgba(59, 130, 246, 0.4)',
  },
  300: {
    ...LEGENDARY_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #D4AF37 0%, #E5C158 50%, #C5A028 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.7)', badgeTextColor: '#FFFAE0', badgeBorderColor: '#F0D264',
    cardBg: 'linear-gradient(135deg, #141210 0%, #1E1A16 50%, #100E0C 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #F0D264 100%)', cardGlow: 'rgba(212, 175, 55, 0.5)',
  },
  400: {
    ...LEGENDARY_BASE as TierVisualConfig, glowIntensity: 0.55,
    badgeGradient: 'linear-gradient(145deg, #E8D5A0 0%, #D4AF37 30%, #B08030 70%, #D4AF37 100%)',
    badgeGlow: 'rgba(232, 213, 160, 0.8)', badgeTextColor: '#FFF8E8', badgeBorderColor: '#F5E6C0',
    cardBg: 'linear-gradient(135deg, #18140E 0%, #221C14 50%, #14100A 100%)',
    cardBorder: 'linear-gradient(135deg, #E8D5A0 0%, #D4AF37 50%, #F5E6C0 100%)', cardGlow: 'rgba(232, 213, 160, 0.6)',
  },
};

// Regional tier configs
const REGIONAL_CONFIGS: Record<string, TierVisualConfig> = {
  GBI: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.3,
    badgeGradient: 'linear-gradient(145deg, #0A2518 0%, #0F3520 50%, #082010 100%)',
    badgeGlow: 'rgba(74, 124, 89, 0.6)', badgeTextColor: '#A8D5B8', badgeBorderColor: '#4A7C59',
    cardBg: 'linear-gradient(135deg, #0A1812 0%, #0F2518 50%, #081410 100%)',
    cardBorder: 'linear-gradient(135deg, #4A7C59 0%, #3A6449 100%)', cardGlow: 'rgba(74, 124, 89, 0.35)',
  },
  EU: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.3,
    badgeGradient: 'linear-gradient(145deg, #0A1530 0%, #102545 50%, #081025 100%)',
    badgeGlow: 'rgba(91, 126, 192, 0.6)', badgeTextColor: '#B8C8E8', badgeBorderColor: '#5B7EC0',
    cardBg: 'linear-gradient(135deg, #0A1018 0%, #101825 50%, #080C14 100%)',
    cardBorder: 'linear-gradient(135deg, #5B7EC0 0%, #4A6AA0 100%)', cardGlow: 'rgba(91, 126, 192, 0.35)',
  },
  USA: {
    ...ELITE_BASE as TierVisualConfig, glowIntensity: 0.3,
    badgeGradient: 'linear-gradient(145deg, #2A1515 0%, #3A2020 50%, #1A0A0A 100%)',
    badgeGlow: 'rgba(199, 91, 91, 0.6)', badgeTextColor: '#F0C0C0', badgeBorderColor: '#C75B5B',
    cardBg: 'linear-gradient(135deg, #1A1012 0%, #251518 50%, #140A0C 100%)',
    cardBorder: 'linear-gradient(135deg, #C75B5B 0%, #A04848 100%)', cardGlow: 'rgba(199, 91, 91, 0.35)',
  },
  WORLD: {
    ...LEGENDARY_BASE as TierVisualConfig, glowIntensity: 0.45,
    badgeGradient: 'linear-gradient(145deg, #1A1830 0%, #252040 50%, #141020 100%)',
    badgeGlow: 'rgba(122, 143, 192, 0.7)', badgeTextColor: '#D0D8F0', badgeBorderColor: '#7A8FC0',
    cardBg: 'linear-gradient(135deg, #101018 0%, #181825 50%, #0C0C14 100%)',
    cardBorder: 'linear-gradient(135deg, #7A8FC0 0%, #D4AF37 100%)', cardGlow: 'rgba(122, 143, 192, 0.45)',
  },
};

// Locked state config
const LOCKED_CONFIG: TierVisualConfig = {
  badgeGradient: 'linear-gradient(145deg, #374151 0%, #1F2937 50%, #111827 100%)',
  badgeGlow: 'rgba(107, 114, 128, 0.2)', badgeTextColor: '#6B7280', badgeBorderColor: '#4B5563',
  cardBg: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #111827 100%)',
  cardBorder: 'linear-gradient(135deg, #374151 0%, #4B5563 100%)', cardGlow: 'rgba(107, 114, 128, 0.1)',
  titleColor: '#6B7280', clubLabelColor: '#4B5563', descriptorColor: '#374151',
  glowIntensity: 0.05, hasAnimatedBorder: false, hasParticles: false, animationSpeed: 0,
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

// Regional icon helper
function getRegionalIcon(tier: string, size: string = 'w-8 h-8'): React.ReactNode {
  const iconClass = cn(size, 'text-current');
  switch (tier) {
    case 'GBI': return <FaLandmarkDome className={iconClass} />;
    case 'EU': return <GiEuropeanFlag className={iconClass} />;
    case 'USA': return <FaFlagUsa className={iconClass} />;
    case 'WORLD': return <GiWorld className={iconClass} />;
    default: return null;
  }
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
  /** Optional mini/compact mode for grids */
  compact?: boolean;
  /** Enable animations (disable in lists for performance) */
  enableAnimations?: boolean;
  /** Show as ghost/placeholder card */
  isGhost?: boolean;
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
// ELITE GAME CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const EliteGameCard: React.FC<EliteGameCardProps> = ({
  tier,
  earned,
  currentProgress = 0,
  targetProgress,
  regionsCompleted,
  compact = false,
  enableAnimations = true,
  isGhost = false,
  className,
  onClick,
  title: titleOverride,
  subtitle: subtitleOverride,
}) => {
  // Determine if this is a milestone or regional card
  const isRegional = ['GBI', 'EU', 'USA', 'WORLD'].includes(tier);
  const threshold = isRegional ? (targetProgress || 100) : parseInt(tier, 10);
  
  // Get tier config
  const config = useMemo(() => {
    if (isGhost || !earned) return LOCKED_CONFIG;
    if (isRegional) return REGIONAL_CONFIGS[tier] || LOCKED_CONFIG;
    return MILESTONE_CONFIGS[threshold] || MILESTONE_CONFIGS[5];
  }, [tier, threshold, earned, isGhost, isRegional]);
  
  // Get display text
  const clubName = titleOverride || CLUB_NAMES[tier] || `${tier} Club`;
  const descriptor = subtitleOverride || CLUB_DESCRIPTORS[tier] || 
    (isRegional ? REGION_TAGLINES[tier.toLowerCase()] : MILESTONE_TAGLINES[threshold]) || '';
  
  // Progress calculation
  const target = targetProgress || threshold;
  const progressPercent = earned ? 100 : Math.min(100, (currentProgress / target) * 100);
  
  // Animation states
  const shouldAnimate = enableAnimations && earned && !isGhost && config.animationSpeed > 0;
  
  // Card dimensions based on compact mode
  const cardHeight = compact ? 'h-[72px]' : 'h-[110px]';
  const badgeSize = compact ? 'w-12 h-12' : 'w-[72px] h-[72px]';
  const numberSize = compact ? 'text-base' : 'text-2xl';
  
  return (
    <motion.div
      className={cn(
        'relative rounded-xl overflow-hidden cursor-pointer select-none w-full',
        cardHeight,
        isGhost && 'opacity-60',
        className
      )}
      style={{
        background: config.cardBg,
        boxShadow: `0 0 20px ${config.cardGlow}, 0 4px 16px rgba(0,0,0,0.3)`,
      }}
      onClick={onClick}
      initial={{ scale: 1 }}
      whileHover={enableAnimations && !isGhost ? { scale: 1.015, y: -2 } : {}}
      whileTap={enableAnimations && !isGhost ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Animated background */}
      {shouldAnimate && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 50%)' }}
          animate={{ x: ['-10%', '10%', '-10%'], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: config.animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {/* Particles */}
      {shouldAnimate && config.hasParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-white/20"
              style={{ left: `${15 + i * 15}%`, top: `${25 + (i % 3) * 20}%` }}
              animate={{ y: [0, -8, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3 + i * 0.4, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}
      
      {/* Border */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: '1px',
          background: config.cardBorder,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      
      {/* Border sweep */}
      {shouldAnimate && config.hasAnimatedBorder && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${config.badgeGlow} 50%, transparent 100%)`, opacity: 0.25 }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
      )}
      
      {/* Content */}
      <div className={cn('relative z-10 h-full flex items-center gap-3', compact ? 'px-2.5' : 'px-4')}>
        {/* Badge */}
        <div className="relative flex-shrink-0">
          {earned && !isGhost && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${config.badgeGlow} 0%, transparent 70%)`, transform: 'scale(1.6)', filter: 'blur(6px)' }}
              animate={shouldAnimate ? { opacity: [config.glowIntensity, config.glowIntensity * 1.3, config.glowIntensity], scale: [1.6, 1.8, 1.6] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          
          <div
            className={cn('relative rounded-full flex items-center justify-center', badgeSize)}
            style={{
              background: config.badgeGradient,
              boxShadow: earned && !isGhost
                ? `0 0 16px ${config.badgeGlow}, inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3)`
                : 'inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <div
              className="absolute inset-1 rounded-full pointer-events-none"
              style={{ border: `1.5px solid ${config.badgeBorderColor}`, opacity: earned && !isGhost ? 0.7 : 0.3 }}
            />
            
            {earned && !isGhost ? (
              isRegional ? (
                <div style={{ color: config.badgeTextColor }}>
                  {getRegionalIcon(tier, compact ? 'w-5 h-5' : 'w-7 h-7')}
                </div>
              ) : (
                <span className={cn('font-bold tracking-tight', numberSize)} style={{ color: config.badgeTextColor, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {threshold}
                </span>
              )
            ) : (
              <Lock className={cn(compact ? 'w-4 h-4' : 'w-5 h-5')} style={{ color: config.badgeTextColor }} />
            )}
          </div>
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3
            className={cn('font-bold tracking-tight truncate', compact ? 'text-sm' : 'text-lg')}
            style={{ color: config.titleColor }}
          >
            {clubName}
          </h3>
          
          <div className={cn('flex items-center gap-1.5 mt-0.5', compact ? 'text-[9px]' : 'text-[11px]')}>
            <span className="font-semibold uppercase tracking-wider" style={{ color: config.clubLabelColor }}>
              {isRegional ? 'COMPLETE' : `${threshold} CLUB`}
            </span>
            {!compact && descriptor && (
              <>
                <span style={{ color: config.descriptorColor }}>•</span>
                <span className="truncate" style={{ color: config.descriptorColor }}>{descriptor}</span>
              </>
            )}
          </div>
          
          {/* Data chips */}
          {!compact && (
            <div className="flex items-center gap-2 mt-1.5 text-[10px]">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: config.titleColor }}>{earned ? target : currentProgress} / {target}</span>
                <span style={{ color: config.descriptorColor }}>{isRegional ? 'Courses' : 'Courses'}</span>
              </div>
              
              {regionsCompleted !== undefined && !isRegional && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: config.titleColor }}>{regionsCompleted}</span>
                  <span style={{ color: config.descriptorColor }}>Regions</span>
                </div>
              )}
            </div>
          )}
          
          {/* Earned / Progress */}
          {!compact && (
            <div className="mt-1.5">
              {earned && !isGhost ? (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                  style={{ background: `${config.badgeGlow}`, border: `1px solid ${config.badgeBorderColor}40`, color: config.clubLabelColor }}
                >
                  <Check className="w-2.5 h-2.5" />
                  Earned
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-1 rounded-full overflow-hidden flex-1 max-w-[120px]" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${config.clubLabelColor} 0%, ${config.badgeBorderColor} 100%)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[9px]" style={{ color: config.descriptorColor }}>{Math.round(progressPercent)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Light streaks for elite+ */}
      {shouldAnimate && threshold >= 150 && (
        <motion.div
          className="absolute w-[200%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          style={{ top: '30%', left: '-50%', transform: 'rotate(-15deg)' }}
          animate={{ x: ['-50%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        />
      )}
    </motion.div>
  );
};

export default EliteGameCard;
