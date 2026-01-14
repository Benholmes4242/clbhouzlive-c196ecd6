/**
 * EliteGameCard - Warm Light Achievement Card
 * 
 * Clean, warm design aligned with Hub design system:
 * - Light backgrounds with warm gradients
 * - Two variants: 'large' (journey map) and 'compact' (grids)
 * - Subtle hover effects only (no shimmer/glow animations)
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

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type EliteCardTier = 
  | '5' | '10' | '20' | '50' | '100' | '150' | '200' | '300' | '400'
  | 'GBI' | 'EU' | 'USA' | 'WORLD';

export type CardVariant = 'large' | 'compact';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER VISUAL CONFIGURATION - WARM LIGHT COLORS
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface TierVisualConfig {
  cardBg: string;
  cardBorder: string;
  badgeGradient: string;
  titleColor: string;
  subtitleColor: string;
  progressTrack: string;
  progressFill: string;
}

// Milestone tier configs - WARM, LIGHT, FRIENDLY
const MILESTONE_CONFIGS: Record<number, TierVisualConfig> = {
  // 5 CLUB - Warm copper/peach
  5: {
    cardBg: 'linear-gradient(135deg, #FFFBF7 0%, #FFF5EB 100%)',
    cardBorder: '#E8D4C4',
    badgeGradient: 'linear-gradient(145deg, #D4A574 0%, #C08050 100%)',
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
    titleColor: '#B45309',
    subtitleColor: '#D97706',
    progressTrack: '#FEF3C7',
    progressFill: '#F59E0B',
  },
};

// Regional tier configs - WARM LIGHT COLORS
const REGIONAL_CONFIGS: Record<string, TierVisualConfig> = {
  // GB & Ireland - Fresh green
  GBI: {
    cardBg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    cardBorder: '#86EFAC',
    badgeGradient: 'linear-gradient(145deg, #4ADE80 0%, #22C55E 100%)',
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
    titleColor: '#6D28D9',
    subtitleColor: '#8B5CF6',
    progressTrack: '#EDE9FE',
    progressFill: '#8B5CF6',
  },
};

// Locked state config - light, subtle appearance
const LOCKED_CONFIG: TierVisualConfig = {
  cardBg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
  cardBorder: '#E2E8F0',
  badgeGradient: 'linear-gradient(145deg, #E2E8F0 0%, #CBD5E1 100%)',
  titleColor: '#94A3B8',
  subtitleColor: '#CBD5E1',
  progressTrack: '#E2E8F0',
  progressFill: '#CBD5E1',
};

// Club names
const CLUB_NAMES: Record<string, string> = {
  '5': '5 Club', '10': '10 Club', '20': '20 Club', '50': '50 Club',
  '100': '100 Club', '150': '150 Club', '200': '200 Club', '300': '300 Club', '400': '400 Club',
  'GBI': 'GB & Ireland', 'EU': 'Continental Europe', 'USA': 'USA Top 100', 'WORLD': 'Worldwide',
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
  
  // Active config: earned uses full config, locked uses LOCKED_CONFIG
  const config = useMemo(() => {
    if (isGhost || !earned) return LOCKED_CONFIG;
    return earnedConfig;
  }, [earned, isGhost, earnedConfig]);
  
  // Get display text
  const displayName = titleOverride || CLUB_NAMES[tier] || `${tier} Club`;
  const tierName = TIER_NAMES[tier] || '';
  const subtitle = subtitleOverride || (isRegional ? REGION_TAGLINES?.[tier.toLowerCase()] : MILESTONE_TAGLINES?.[threshold]) || tierName;
  
  // Progress calculation
  const target = targetProgress || threshold;
  const progressPercent = earned ? 100 : Math.min(100, (currentProgress / target) * 100);
  const remaining = earned ? 0 : Math.max(0, target - currentProgress);
  
  // Hover animation props
  const hoverProps = enableAnimations && !isGhost ? { scale: 1.02, y: -2 } : {};
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // COMPACT VARIANT
  // ═══════════════════════════════════════════════════════════════════════════════════════
  if (isCompact) {
    return (
      <motion.div
        className={cn(
          "flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer",
          isGhost && "opacity-60",
          className
        )}
        style={{
          background: config.cardBg,
          borderColor: config.cardBorder,
          minHeight: '90px',
        }}
        onClick={onClick}
        whileHover={hoverProps}
        whileTap={enableAnimations ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Badge circle */}
        <div 
          className="relative w-9 h-9 rounded-full flex items-center justify-center mb-2"
          style={{ background: config.badgeGradient }}
        >
          {isRegional ? (
            getRegionalIcon(tier, 'w-4 h-4')
          ) : (
            <span className="text-white font-bold text-sm">{threshold}</span>
          )}
          
          {/* Earned checkmark */}
          {earned && !isGhost && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          
          {/* Locked icon */}
          {!earned && !isGhost && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-2 h-2 text-slate-400" />
            </div>
          )}
        </div>
        
        {/* Label */}
        <span 
          className="text-xs font-semibold"
          style={{ color: config.titleColor }}
        >
          {isRegional ? tier : `${threshold} Club`}
        </span>
        
        {/* Status */}
        {earned && !isGhost && (
          <span className="text-[10px] text-green-600 font-medium">Unlocked</span>
        )}
        {!earned && !isGhost && (
          <span className="text-[10px] text-slate-400">{remaining} to go</span>
        )}
      </motion.div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // LARGE VARIANT (Journey Map)
  // ═══════════════════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer w-full",
        isGhost && "opacity-60",
        className
      )}
      style={{
        background: config.cardBg,
        borderColor: config.cardBorder,
        boxShadow: earned && !isGhost ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onClick={onClick}
      whileHover={hoverProps}
      whileTap={enableAnimations ? { scale: 0.99 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Badge circle */}
      <div 
        className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: config.badgeGradient }}
      >
        {isRegional ? (
          getRegionalIcon(tier, 'w-6 h-6')
        ) : (
          <span className="text-white font-bold text-lg">{threshold}</span>
        )}
        
        {/* Earned checkmark */}
        {earned && !isGhost && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-sm">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        
        {/* Locked icon */}
        {!earned && !isGhost && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
            <Lock className="w-2.5 h-2.5 text-slate-400" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
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
        {!earned && !isGhost && (
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
      <div className="flex-shrink-0">
        {earned && !isGhost && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            Earned
          </span>
        )}
        {!earned && !isGhost && (
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
