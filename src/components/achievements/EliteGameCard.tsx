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
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MILESTONE_TIER_META, getMilestoneMetaByThreshold } from '@/config/achievements';
import { MILESTONE_TAGLINES } from '@/config/achievementTaglines';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER VISUAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface TierVisualConfig {
  // Badge styling
  badgeGradient: string;       // Gradient for the medallion
  badgeGlow: string;           // Glow color behind badge
  badgeTextColor: string;      // Number text color
  badgeBorderColor: string;    // Ring around the badge
  
  // Card styling
  cardBg: string;              // Main background gradient
  cardBorder: string;          // Border gradient/color
  cardGlow: string;            // Outer glow
  
  // Text colors
  titleColor: string;          // Main title
  clubLabelColor: string;      // "X CLUB" label
  descriptorColor: string;     // Tagline descriptor
  
  // Animation intensity
  glowIntensity: number;       // 0-1 for glow opacity
  hasAnimatedBorder: boolean;  // Border glow sweep
  hasParticles: boolean;       // Subtle particle dust
  animationSpeed: number;      // Gradient drift speed in seconds
}

// Entry Tier (5/10/20) - Clean but unmistakably game-reward
const ENTRY_TIER_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.15,
  hasAnimatedBorder: false,
  hasParticles: false,
  animationSpeed: 0,
  titleColor: '#E8E6E1',
  clubLabelColor: '#C9A94A',
  descriptorColor: '#9CA3AF',
};

// Progression Tier (50/100) - Dial turned up
const PROGRESSION_TIER_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.25,
  hasAnimatedBorder: true,
  hasParticles: true,
  animationSpeed: 10,
  titleColor: '#F5F5F0',
  clubLabelColor: '#D4AF37',
  descriptorColor: '#A1A7B0',
};

// Elite Tier (150/200) - Rare, premium feel
const ELITE_TIER_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.35,
  hasAnimatedBorder: true,
  hasParticles: true,
  animationSpeed: 8,
  titleColor: '#FFFFFF',
  clubLabelColor: '#E5C158',
  descriptorColor: '#B8BFC8',
};

// Legendary Tier (300/400) - Mythic, alive
const LEGENDARY_TIER_BASE: Partial<TierVisualConfig> = {
  glowIntensity: 0.45,
  hasAnimatedBorder: true,
  hasParticles: true,
  animationSpeed: 6,
  titleColor: '#FFFFFF',
  clubLabelColor: '#F0D264',
  descriptorColor: '#C8CED6',
};

// Complete tier configurations with colors
const TIER_VISUAL_CONFIG: Record<number, TierVisualConfig> = {
  5: {
    ...ENTRY_TIER_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #4A3728 100%)',
    badgeGlow: 'rgba(139, 115, 85, 0.4)',
    badgeTextColor: '#D4C4B0',
    badgeBorderColor: '#A08060',
    cardBg: 'linear-gradient(135deg, #1C1915 0%, #252220 50%, #1A1816 100%)',
    cardBorder: 'linear-gradient(135deg, #8B7355 0%, #6B5344 100%)',
    cardGlow: 'rgba(139, 115, 85, 0.2)',
  },
  10: {
    ...ENTRY_TIER_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #A8A8A8 0%, #808080 50%, #606060 100%)',
    badgeGlow: 'rgba(168, 168, 168, 0.4)',
    badgeTextColor: '#E0E0E0',
    badgeBorderColor: '#B0B0B0',
    cardBg: 'linear-gradient(135deg, #1A1A1C 0%, #222226 50%, #18181A 100%)',
    cardBorder: 'linear-gradient(135deg, #A8A8A8 0%, #707070 100%)',
    cardGlow: 'rgba(168, 168, 168, 0.2)',
  },
  20: {
    ...ENTRY_TIER_BASE as TierVisualConfig,
    glowIntensity: 0.18,
    badgeGradient: 'linear-gradient(145deg, #D4AF37 0%, #C5A028 50%, #A08020 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.4)',
    badgeTextColor: '#FFF8E0',
    badgeBorderColor: '#E5C158',
    cardBg: 'linear-gradient(135deg, #1C1A15 0%, #252318 50%, #1A1815 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #A08020 100%)',
    cardGlow: 'rgba(212, 175, 55, 0.25)',
  },
  50: {
    ...PROGRESSION_TIER_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #FFD700 0%, #DAA520 50%, #B8860B 100%)',
    badgeGlow: 'rgba(255, 215, 0, 0.5)',
    badgeTextColor: '#FFFAE0',
    badgeBorderColor: '#FFE55C',
    cardBg: 'linear-gradient(135deg, #1A1814 0%, #222016 50%, #181612 100%)',
    cardBorder: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
    cardGlow: 'rgba(255, 215, 0, 0.3)',
  },
  100: {
    ...PROGRESSION_TIER_BASE as TierVisualConfig,
    glowIntensity: 0.3,
    badgeGradient: 'linear-gradient(145deg, #1A1A1A 0%, #2D2D2D 50%, #0A0A0A 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.5)',
    badgeTextColor: '#D4AF37',
    badgeBorderColor: '#D4AF37',
    cardBg: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 50%, #0A0A0A 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #8B7355 100%)',
    cardGlow: 'rgba(212, 175, 55, 0.35)',
  },
  150: {
    ...ELITE_TIER_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #0A2018 0%, #0F3025 50%, #081810 100%)',
    badgeGlow: 'rgba(34, 197, 94, 0.6)',
    badgeTextColor: '#A8E6CF',
    badgeBorderColor: '#22C55E',
    cardBg: 'linear-gradient(135deg, #0A1510 0%, #0F251A 50%, #081210 100%)',
    cardBorder: 'linear-gradient(135deg, #22C55E 0%, #D4AF37 100%)',
    cardGlow: 'rgba(34, 197, 94, 0.4)',
  },
  200: {
    ...ELITE_TIER_BASE as TierVisualConfig,
    glowIntensity: 0.4,
    badgeGradient: 'linear-gradient(145deg, #0A1525 0%, #102040 50%, #081020 100%)',
    badgeGlow: 'rgba(59, 130, 246, 0.6)',
    badgeTextColor: '#93C5FD',
    badgeBorderColor: '#3B82F6',
    cardBg: 'linear-gradient(135deg, #0A0F18 0%, #101828 50%, #080C14 100%)',
    cardBorder: 'linear-gradient(135deg, #3B82F6 0%, #D4AF37 100%)',
    cardGlow: 'rgba(59, 130, 246, 0.4)',
  },
  300: {
    ...LEGENDARY_TIER_BASE as TierVisualConfig,
    badgeGradient: 'linear-gradient(145deg, #D4AF37 0%, #E5C158 50%, #C5A028 100%)',
    badgeGlow: 'rgba(212, 175, 55, 0.7)',
    badgeTextColor: '#FFFAE0',
    badgeBorderColor: '#F0D264',
    cardBg: 'linear-gradient(135deg, #141210 0%, #1E1A16 50%, #100E0C 100%)',
    cardBorder: 'linear-gradient(135deg, #D4AF37 0%, #F0D264 100%)',
    cardGlow: 'rgba(212, 175, 55, 0.5)',
  },
  400: {
    ...LEGENDARY_TIER_BASE as TierVisualConfig,
    glowIntensity: 0.55,
    badgeGradient: 'linear-gradient(145deg, #E8D5A0 0%, #D4AF37 30%, #B08030 70%, #D4AF37 100%)',
    badgeGlow: 'rgba(232, 213, 160, 0.8)',
    badgeTextColor: '#FFF8E8',
    badgeBorderColor: '#F5E6C0',
    cardBg: 'linear-gradient(135deg, #18140E 0%, #221C14 50%, #14100A 100%)',
    cardBorder: 'linear-gradient(135deg, #E8D5A0 0%, #D4AF37 50%, #F5E6C0 100%)',
    cardGlow: 'rgba(232, 213, 160, 0.6)',
  },
};

// Default locked config
const LOCKED_CONFIG: TierVisualConfig = {
  badgeGradient: 'linear-gradient(145deg, #374151 0%, #1F2937 50%, #111827 100%)',
  badgeGlow: 'rgba(107, 114, 128, 0.2)',
  badgeTextColor: '#6B7280',
  badgeBorderColor: '#4B5563',
  cardBg: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #111827 100%)',
  cardBorder: 'linear-gradient(135deg, #374151 0%, #4B5563 100%)',
  cardGlow: 'rgba(107, 114, 128, 0.1)',
  titleColor: '#6B7280',
  clubLabelColor: '#4B5563',
  descriptorColor: '#374151',
  glowIntensity: 0.05,
  hasAnimatedBorder: false,
  hasParticles: false,
  animationSpeed: 0,
};

// Club name overrides based on spec
const CLUB_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  150: 'Global Elite',
  200: 'Clubhouse Elite',
  300: 'Club Champion',
  400: 'World Master',
};

// Club descriptors
const CLUB_DESCRIPTORS: Record<number, string> = {
  5: 'First steps',
  10: 'Finding fairways',
  20: 'Building legacy',
  50: 'Proper pedigree',
  100: 'Rare achievement',
  150: 'Worldwide dominance',
  200: 'Elite status',
  300: 'Legendary',
  400: 'Ultimate mastery',
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export interface EliteGameCardProps {
  /** Milestone threshold (5, 10, 20, 50, 100, 150, 200, 300, 400) */
  threshold: number;
  /** Is this milestone earned? */
  earned: boolean;
  /** Current progress toward this milestone */
  currentProgress?: number;
  /** Number of regions completed (optional) */
  regionsCompleted?: number;
  /** Optional mini/compact mode for grids */
  compact?: boolean;
  /** Enable animations (disable in lists for performance) */
  enableAnimations?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// ELITE GAME CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const EliteGameCard: React.FC<EliteGameCardProps> = ({
  threshold,
  earned,
  currentProgress = 0,
  regionsCompleted,
  compact = false,
  enableAnimations = true,
  className,
  onClick,
}) => {
  // Get tier config
  const config = useMemo(() => {
    if (!earned) return LOCKED_CONFIG;
    return TIER_VISUAL_CONFIG[threshold] || TIER_VISUAL_CONFIG[5];
  }, [threshold, earned]);
  
  // Get milestone metadata
  const meta = getMilestoneMetaByThreshold(threshold);
  const clubName = CLUB_NAMES[threshold] || meta?.tierName || `${threshold} Club`;
  const descriptor = CLUB_DESCRIPTORS[threshold] || MILESTONE_TAGLINES[threshold] || '';
  
  // Progress calculation
  const progressPercent = earned ? 100 : Math.min(100, (currentProgress / threshold) * 100);
  
  // Animation states
  const shouldAnimate = enableAnimations && earned && config.animationSpeed > 0;
  
  // Card dimensions based on compact mode
  const cardHeight = compact ? 'h-[80px]' : 'h-[120px]';
  const badgeSize = compact ? 'w-14 h-14' : 'w-20 h-20';
  const numberSize = compact ? 'text-lg' : 'text-3xl';
  
  return (
    <motion.div
      className={cn(
        'relative rounded-2xl overflow-hidden cursor-pointer select-none',
        'min-w-[280px]',
        cardHeight,
        className
      )}
      style={{
        background: config.cardBg,
        boxShadow: `0 0 30px ${config.cardGlow}, 0 4px 20px rgba(0,0,0,0.4)`,
      }}
      onClick={onClick}
      initial={{ scale: 1 }}
      whileHover={enableAnimations ? { scale: 1.02, y: -4 } : {}}
      whileTap={enableAnimations ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Animated background gradient */}
      {shouldAnimate && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 50%)',
          }}
          animate={{
            x: ['-10%', '10%', '-10%'],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: config.animationSpeed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      {/* Particle dust effect for higher tiers */}
      {shouldAnimate && config.hasParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-white/20"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
      
      {/* Animated border glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: '1.5px',
          background: config.cardBorder,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      
      {/* Border glow sweep animation */}
      {shouldAnimate && config.hasAnimatedBorder && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${config.badgeGlow} 50%, transparent 100%)`,
            opacity: 0.3,
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 2,
          }}
        />
      )}
      
      {/* Main content layout */}
      <div className={cn(
        'relative z-10 h-full flex items-center gap-4',
        compact ? 'px-3' : 'px-5'
      )}>
        {/* Left: Hero Badge Medallion */}
        <div className="relative flex-shrink-0">
          {/* Badge glow aura */}
          {earned && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${config.badgeGlow} 0%, transparent 70%)`,
                transform: 'scale(1.8)',
                filter: 'blur(8px)',
              }}
              animate={shouldAnimate ? {
                opacity: [config.glowIntensity, config.glowIntensity * 1.3, config.glowIntensity],
                scale: [1.8, 2, 1.8],
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
          
          {/* Medallion container */}
          <div
            className={cn(
              'relative rounded-full flex items-center justify-center',
              badgeSize
            )}
            style={{
              background: config.badgeGradient,
              boxShadow: earned 
                ? `0 0 20px ${config.badgeGlow}, inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3)`
                : 'inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {/* Inner ring */}
            <div
              className="absolute inset-1.5 rounded-full pointer-events-none"
              style={{
                border: `2px solid ${config.badgeBorderColor}`,
                opacity: earned ? 0.8 : 0.3,
              }}
            />
            
            {/* Inner glow highlight */}
            <div
              className="absolute top-1 left-2 w-1/3 h-1/4 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                opacity: earned ? 1 : 0.3,
              }}
            />
            
            {/* Number or Lock */}
            {earned ? (
              <span
                className={cn('font-bold tracking-tight', numberSize)}
                style={{
                  color: config.badgeTextColor,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {threshold}
              </span>
            ) : (
              <Lock 
                className={cn(compact ? 'w-5 h-5' : 'w-7 h-7')}
                style={{ color: config.badgeTextColor }}
              />
            )}
          </div>
          
          {/* Pedestal/base shadow for earned badges */}
          {earned && !compact && (
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(ellipse, ${config.badgeGlow} 0%, transparent 70%)`,
                filter: 'blur(3px)',
                opacity: 0.6,
              }}
            />
          )}
        </div>
        
        {/* Right: Text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Title */}
          <h3
            className={cn(
              'font-bold tracking-tight truncate',
              compact ? 'text-base' : 'text-xl'
            )}
            style={{ color: config.titleColor }}
          >
            {clubName}
          </h3>
          
          {/* Club label + Descriptor */}
          <div className={cn(
            'flex items-center gap-2 mt-0.5',
            compact ? 'text-[10px]' : 'text-xs'
          )}>
            <span
              className="font-semibold uppercase tracking-wider"
              style={{ color: config.clubLabelColor }}
            >
              {threshold} CLUB
            </span>
            {!compact && descriptor && (
              <>
                <span style={{ color: config.descriptorColor }}>•</span>
                <span
                  className="truncate"
                  style={{ color: config.descriptorColor }}
                >
                  {descriptor}
                </span>
              </>
            )}
          </div>
          
          {/* Data chips (progress / regions) */}
          {!compact && (
            <div className={cn(
              'flex items-center gap-3 mt-2',
              'text-[11px]'
            )}>
              {/* Progress chip */}
              <div
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ color: config.titleColor }}>
                  {earned ? threshold : currentProgress} / {threshold}
                </span>
                <span style={{ color: config.descriptorColor }}>Courses</span>
              </div>
              
              {/* Regions chip */}
              {regionsCompleted !== undefined && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ color: config.titleColor }}>{regionsCompleted}</span>
                  <span style={{ color: config.descriptorColor }}>Regions</span>
                </div>
              )}
            </div>
          )}
          
          {/* Earned badge */}
          {earned && !compact && (
            <div className="mt-2">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${config.badgeGlow}, rgba(255,255,255,0.1))`,
                  border: `1px solid ${config.badgeBorderColor}40`,
                  color: config.clubLabelColor,
                }}
              >
                <Check className="w-3 h-3" />
                Earned
              </div>
            </div>
          )}
          
          {/* Progress bar for locked cards */}
          {!earned && !compact && (
            <div className="mt-2">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  width: '100%',
                  maxWidth: '180px',
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${config.clubLabelColor} 0%, ${config.badgeBorderColor} 100%)`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div
                className="text-[10px] mt-1"
                style={{ color: config.descriptorColor }}
              >
                {Math.round(progressPercent)}% complete
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Light streaks overlay for elite+ tiers */}
      {shouldAnimate && threshold >= 150 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[200%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{
              top: '30%',
              left: '-50%',
              transform: 'rotate(-15deg)',
            }}
            animate={{ x: ['-50%', '100%'] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 4,
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default EliteGameCard;
