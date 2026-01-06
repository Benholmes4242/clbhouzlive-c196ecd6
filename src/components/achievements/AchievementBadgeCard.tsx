/**
 * AchievementBadgeCard - "Collector Card" Design (Phase 2)
 * 
 * Premium collectible trophy card with:
 * - Tiered visual language with distinct states (LOCKED/UNLOCKED/NEW/GHOST)
 * - Large milestone numbers prominently displayed
 * - Emblem watermarks with subtle patterns
 * - Micro-animations via Framer Motion
 * - Premium glass styling with tier-weighted glows
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { cn } from '@/lib/utils';
import { ACHIEVEMENT_MILESTONES } from '@/config/achievements';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { MILESTONE_TAGLINES, REGION_TAGLINES, REGION_FULL_NAMES } from '@/config/achievementTaglines';

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
  'GBI': 'Great Britain & Ireland Top 100',
  'EU': 'Continental Europe Top 100',
  'USA': 'USA Top 100',
  'WORLD': 'Worldwide Top 100',
};

// Region slug mapping for taglines
const TIER_TO_REGION_SLUG: Record<string, string> = {
  'GBI': 'gb-i',
  'EU': 'europe',
  'USA': 'usa',
  'WORLD': 'global',
};

// Tier-specific styling configuration
interface TierStyle {
  glowOpacity: number;
  glowScale: number;
  glowBlur: number;
  pattern: 'laurel' | 'trophy' | 'starburst' | 'topographic' | 'diamond';
}

const TIER_STYLES: Record<string, TierStyle> = {
  '5':    { glowOpacity: 0.12, glowScale: 2.4, glowBlur: 6,  pattern: 'laurel' },
  '10':   { glowOpacity: 0.14, glowScale: 2.5, glowBlur: 7,  pattern: 'laurel' },
  '20':   { glowOpacity: 0.15, glowScale: 2.6, glowBlur: 8,  pattern: 'trophy' },
  '50':   { glowOpacity: 0.16, glowScale: 2.7, glowBlur: 9,  pattern: 'trophy' },
  '100':  { glowOpacity: 0.18, glowScale: 2.8, glowBlur: 10, pattern: 'starburst' },
  '200':  { glowOpacity: 0.20, glowScale: 3.0, glowBlur: 11, pattern: 'starburst' },
  '300':  { glowOpacity: 0.24, glowScale: 3.2, glowBlur: 12, pattern: 'diamond' },
  '400':  { glowOpacity: 0.28, glowScale: 3.5, glowBlur: 14, pattern: 'diamond' },
  'GBI':  { glowOpacity: 0.16, glowScale: 2.6, glowBlur: 8,  pattern: 'topographic' },
  'EU':   { glowOpacity: 0.16, glowScale: 2.6, glowBlur: 8,  pattern: 'topographic' },
  'USA':  { glowOpacity: 0.16, glowScale: 2.6, glowBlur: 8,  pattern: 'topographic' },
  'WORLD':{ glowOpacity: 0.20, glowScale: 3.0, glowBlur: 10, pattern: 'topographic' },
};

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
 * Get the background icon for regional tiers
 */
function getRegionalIcon(tier: string): React.ReactNode | null {
  const iconClass = "w-12 h-12";
  switch (tier) {
    case 'WORLD': return <GiWorld className={iconClass} />;
    case 'GBI': return <FaLandmarkDome className={iconClass} />;
    case 'USA': return <FaFlagUsa className={iconClass} />;
    case 'EU': return <GiEuropeanFlag className={iconClass} />;
    default: return null;
  }
}

/**
 * SVG Pattern for watermark backgrounds
 */
const WatermarkPattern: React.FC<{ pattern: TierStyle['pattern']; color: string; unlocked: boolean }> = ({ 
  pattern, 
  color,
  unlocked 
}) => {
  const opacity = unlocked ? 0.06 : 0.03;
  
  switch (pattern) {
    case 'laurel':
      return (
        <svg className="absolute right-1 top-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none" viewBox="0 0 100 100">
          <path
            d="M50 10 C30 25, 20 50, 30 80 M50 10 C70 25, 80 50, 70 80"
            fill="none"
            stroke={color}
            strokeWidth="3"
            opacity={opacity}
          />
          <circle cx="50" cy="50" r="12" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
        </svg>
      );
    case 'trophy':
      return (
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 pointer-events-none" viewBox="0 0 100 100">
          <path
            d="M30 20 L30 50 Q30 70 50 80 Q70 70 70 50 L70 20 M20 20 Q20 40 30 45 M80 20 Q80 40 70 45 M50 80 L50 95 M35 95 L65 95"
            fill="none"
            stroke={color}
            strokeWidth="3"
            opacity={opacity}
          />
        </svg>
      );
    case 'starburst':
      return (
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none" viewBox="0 0 100 100">
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <line
              key={angle}
              x1="50"
              y1="50"
              x2={50 + 40 * Math.cos(angle * Math.PI / 180)}
              y2={50 + 40 * Math.sin(angle * Math.PI / 180)}
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
          ))}
          <circle cx="50" cy="50" r="15" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
        </svg>
      );
    case 'diamond':
      return (
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none" viewBox="0 0 100 100">
          <path
            d="M50 10 L80 35 L50 90 L20 35 Z M20 35 L80 35"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            opacity={opacity}
          />
          <circle cx="50" cy="40" r="8" fill="none" stroke={color} strokeWidth="1.5" opacity={opacity * 0.8} />
        </svg>
      );
    case 'topographic':
      return (
        <svg className="absolute right-1 top-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none" viewBox="0 0 100 100">
          <ellipse cx="50" cy="50" rx="40" ry="35" fill="none" stroke={color} strokeWidth="1.5" opacity={opacity} />
          <ellipse cx="50" cy="50" rx="30" ry="25" fill="none" stroke={color} strokeWidth="1.5" opacity={opacity * 0.8} />
          <ellipse cx="50" cy="50" rx="18" ry="14" fill="none" stroke={color} strokeWidth="1.5" opacity={opacity * 0.6} />
        </svg>
      );
  }
};

export interface AchievementBadgeCardProps {
  tier: AchievementTier;
  title: string;
  subtitle: string;
  unlocked: boolean;
  isPrimary?: boolean;
  unlockedAt?: string;
  remaining?: number;
  /** Mini size for Trophy Case grid (3-across) */
  compact?: boolean;
  isGhost?: boolean;
  status?: AchievementStatus;
  totalTop100Played?: number;
  playedOnList?: number;
  totalOnList?: number;
  regionGlyph?: React.ReactNode;
  /** Enables pulse animation for current target */
  isCurrentTarget?: boolean;
  /** For showing "Requires X courses" in locked ghost cards */
  threshold?: number;
  /** Show witty tagline subtext (only true on Quest page) */
  showSubtext?: boolean;
}

/**
 * AchievementBadgeCard - Premium Collector Card
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
  isCurrentTarget = false,
  threshold: propThreshold,
  showSubtext = false,
}) => {
  const tierLabel = TIER_LABELS[tier] || tier;
  const clubName = CLUB_NAMES[tier] || title;
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES['5'];
  const tierAccentColor = getTierAccentColor(tier);
  const lockedColor = '#94a3b8';
  const accentColor = unlocked && !isGhost ? tierAccentColor : lockedColor;
  
  // Determine if this is a milestone (numeric) or regional card
  const parsedThreshold = parseInt(tier, 10);
  const isMilestone = !isNaN(parsedThreshold);
  const isRegional = !isMilestone;
  // Use prop threshold or parsed threshold
  const threshold = propThreshold ?? parsedThreshold;
  
  // Determine effective status
  const effectiveStatus = status || (isGhost ? 'LOCKED' : unlocked ? 'UNLOCKED' : 'LOCKED');
  const isNew = effectiveStatus === 'NEW';
  
  // Status label - use "Earned" for unlocked, "Requires X" for locked with remaining
  const statusLabel = effectiveStatus === 'NEW' 
    ? 'NEW' 
    : effectiveStatus === 'UNLOCKED' 
      ? '✓ Earned' 
      : isGhost && remaining !== undefined
        ? `Requires ${threshold} courses`
        : remaining !== undefined 
          ? `${remaining} to go` 
          : 'Locked';

  // Animation variants
  const cardVariants = {
    initial: { scale: 1, y: 0 },
    hover: unlocked && !isGhost ? { 
      scale: 1.02, 
      y: -3,
      transition: { type: 'spring' as const, stiffness: 400, damping: 25 }
    } : { scale: 1, y: 0 },
  };

  const glowVariants = {
    initial: { opacity: tierStyle.glowOpacity, scale: tierStyle.glowScale },
    hover: { 
      opacity: tierStyle.glowOpacity * 1.4,
      scale: tierStyle.glowScale * 0.9,
      transition: { duration: 0.2 }
    },
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl flex flex-col justify-between relative overflow-hidden cursor-default select-none',
        // Mini size for Trophy Case (3-across grid)
        compact 
          ? 'min-w-0 h-[72px] px-2.5 py-2'
          : 'min-w-[180px] h-[88px] px-4 py-2.5',
        // Ghost styling - premium etched glass look
        isGhost && 'border-2 border-dashed'
      )}
      style={{
        background: isGhost 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)'
          : unlocked 
            ? `linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`
            : 'linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)',
        border: isGhost 
          ? `2px dashed ${accentColor}30`
          : unlocked
            ? `1px solid ${accentColor}25`
            : `1px solid rgba(148, 163, 184, 0.15)`,
        // Top edge accent for unlocked cards
        borderTop: unlocked && !isGhost ? `2px solid ${accentColor}50` : undefined,
        backdropFilter: 'blur(12px)',
        opacity: isGhost ? 0.85 : (!unlocked ? 0.9 : 1),
        boxShadow: unlocked && !isGhost 
          ? `0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px ${accentColor}08`
          : isGhost
            ? 'inset 0 1px 2px rgba(255,255,255,0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
    >
      {/* Premium top highlight sheen */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 20%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.8) 80%, transparent 100%)',
          opacity: unlocked && !isGhost ? 1 : 0.5,
        }}
      />

      {/* Corner accent glow */}
      {unlocked && !isGhost && (
        <motion.div 
          className="absolute -bottom-4 -left-4 w-24 h-24 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at bottom left, ${accentColor}25 0%, transparent 60%)`,
          }}
          variants={glowVariants}
        />
      )}

      {/* Watermark pattern - only for regional cards */}
      {isRegional && (
        <div 
          className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: accentColor, opacity: unlocked && !isGhost ? 0.08 : 0.04 }}
        >
          {getRegionalIcon(tier)}
        </div>
      )}

      {/* Current target pulse */}
      {isCurrentTarget && !unlocked && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ 
            border: `2px solid ${accentColor}`,
            opacity: 0.3,
          }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
      )}

      {/* NEW badge chip */}
      {isNew && (
        <motion.div 
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
          style={{
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}40`,
            color: accentColor,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          NEW
        </motion.div>
      )}

      {/* Top row: Icon + Content */}
      <div className={cn("flex items-start relative z-10", compact ? "gap-2" : "gap-3")}>
        {/* Trophy/Number medallion */}
        <div className="relative flex-shrink-0">
          {/* Rarity glow aura */}
          {unlocked && !isGhost && !compact && (
            <motion.div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}60 40%, transparent 70%)`,
                filter: `blur(${tierStyle.glowBlur}px)`,
              }}
              variants={glowVariants}
            />
          )}
          
          {/* Medallion container */}
          <div 
            className={cn(
              "rounded-xl flex items-center justify-center relative overflow-hidden",
              compact ? "w-8 h-8" : "w-10 h-10"
            )}
            style={{ 
              backgroundColor: unlocked && !isGhost 
                ? `${accentColor}12` 
                : 'rgba(148, 163, 184, 0.08)',
              border: `1.5px solid ${unlocked && !isGhost ? `${accentColor}25` : 'rgba(148, 163, 184, 0.12)'}`,
              boxShadow: unlocked && !isGhost
                ? `inset 1px 1px 3px rgba(255,255,255,0.5), inset -1px -1px 2px ${accentColor}10, 0 2px 4px ${accentColor}15`
                : 'inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            {/* Inner highlight */}
            {!compact && (
              <div 
                className="absolute top-0 left-0 w-4 h-4 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at top left, rgba(255,255,255,0.6) 0%, transparent 70%)',
                }}
              />
            )}
            
            {/* Display number for milestones, icon for regional/locked */}
            {/* In compact mode for locked cards, show number/trophy instead of lock (lock goes to bottom right) */}
            {isMilestone ? (
              <span 
                className={cn("font-bold relative z-10", compact ? "text-xs" : "text-base")}
                style={{ color: unlocked && !isGhost ? accentColor : lockedColor }}
              >
                {threshold}
              </span>
            ) : unlocked && !isGhost ? (
              <Trophy 
                className={cn("relative z-10", compact ? "w-3 h-3" : "w-4 h-4")}
                style={{ color: accentColor }} 
              />
            ) : compact ? (
              // Compact locked regional: show trophy placeholder (lock at bottom right)
              <Trophy 
                className="relative z-10 w-3 h-3"
                style={{ color: lockedColor }} 
              />
            ) : (
              <Lock 
                className="relative z-10 w-4 h-4"
                style={{ color: lockedColor }} 
              />
            )}
          </div>
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0 overflow-hidden text-left">
          {/* COMPACT MODE: Show club name only (no tier label to avoid truncation) */}
          {compact ? (
            <div 
              className="text-[11px] font-semibold leading-tight line-clamp-1"
              style={{ color: unlocked && !isGhost ? accentColor : 'var(--quest-text-tertiary, #97A1AA)' }}
            >
              {clubName}
            </div>
          ) : (
            <>
              {/* FULL MODE: Club name as title - colored by tier */}
              <div 
                className="text-[13px] font-semibold leading-tight truncate"
                style={{ color: unlocked && !isGhost ? accentColor : 'var(--quest-text-tertiary, #97A1AA)' }}
              >
                {clubName}
              </div>
              {/* Witty tagline as subtitle - only shown when showSubtext is true */}
              {showSubtext && (
                <div 
                  className="text-[10px] leading-tight mt-0.5 line-clamp-2"
                  style={{ color: unlocked && !isGhost ? `${accentColor}90` : 'var(--quest-text-tertiary, #97A1AA)' }}
                >
                  {isMilestone 
                    ? (MILESTONE_TAGLINES[threshold] || subtitle)
                    : (REGION_TAGLINES[TIER_TO_REGION_SLUG[tier]] || subtitle)
                  }
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom row: Status chip - hidden in compact mode */}
      {!compact && (
        <div className="flex justify-between items-end relative z-10">
          {/* Milestone number display for unlocked milestones */}
          {isMilestone && unlocked && !isGhost && (
            <div 
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: `${accentColor}60` }}
            >
              {threshold} CLUB
            </div>
          )}
          {(!isMilestone || !unlocked || isGhost) && <div />}
          
          <motion.div 
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wide",
              isNew && "gap-1"
            )}
            style={{
              backgroundColor: isNew 
                ? `${accentColor}18`
                : unlocked && !isGhost 
                  ? `${accentColor}10` 
                  : 'rgba(148, 163, 184, 0.08)',
              border: `1px solid ${
                isNew 
                  ? `${accentColor}35`
                  : unlocked && !isGhost 
                    ? `${accentColor}20` 
                    : 'rgba(148, 163, 184, 0.12)'
              }`,
              color: unlocked && !isGhost ? accentColor : '#94a3b8',
            }}
            whileHover={unlocked ? { scale: 1.05 } : {}}
          >
            {isNew && <Sparkles className="w-2.5 h-2.5" />}
            {statusLabel}
          </motion.div>
        </div>
      )}

      {/* Compact mode: "X CLUB" label at bottom left for unlocked milestones */}
      {compact && unlocked && !isGhost && isMilestone && (
        <div 
          className="absolute bottom-1.5 left-2 z-10 text-[8px] font-semibold uppercase tracking-widest"
          style={{ color: `${accentColor}60` }}
        >
          {threshold} CLUB
        </div>
      )}

      {/* Compact mode: Lock indicator at bottom right for locked cards */}
      {compact && !unlocked && !isGhost && (
        <div className="absolute bottom-1.5 right-2 z-10">
          <div 
            className="flex items-center justify-center w-4 h-4 rounded-full"
            style={{
              backgroundColor: 'rgba(148, 163, 184, 0.12)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <Lock className="w-2.5 h-2.5" style={{ color: lockedColor }} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AchievementBadgeCard;
