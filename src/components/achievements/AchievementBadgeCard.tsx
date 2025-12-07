import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getTierPalette, 
  MILESTONE_THEMES,
  MilestoneTier,
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
 * Canonical three-row card layout:
 * - Row 1: Tier band pill (left) + Status chip (right)
 * - Row 2: Hero stat block - large threshold number with "Club" label
 * - Row 3: Trophy icon + named club label
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
  
  // Derive status label
  const statusLabel = status 
    ? status === 'NEW' ? 'New' : status === 'UNLOCKED' ? 'Unlocked' : 'Locked'
    : isGhost 
      ? 'Next badge' 
      : unlocked 
        ? 'Unlocked' 
        : remaining !== undefined 
          ? `${remaining} to go` 
          : 'Locked';

  // For regional cards, show the region-specific content
  const heroValue = isMilestone ? threshold.toString() : tierLabel;
  const heroLabel = isMilestone ? 'Club' : 'Top 100';

  return (
    <div
      className={cn(
        // Canonical global card shape with SDS rounded corners
        'rounded-sq-lg flex flex-col justify-between transition-all duration-150 relative overflow-hidden',
        // Fixed global size for ALL achievement badges site-wide
        'min-w-[160px] w-[160px] h-[140px] px-3.5 py-3',
        unlocked && !isGhost
          ? 'shadow-[0_8px_24px_rgba(15,23,42,0.12)]' 
          : 'shadow-sm',
        // Micro-interactions
        'active:scale-[0.98]',
        unlocked && !isGhost && 'hover:shadow-[0_12px_32px_rgba(16,185,129,0.18)]',
        // Ghost styling
        isGhost && 'border border-dashed border-white/60'
      )}
      style={{
        background: unlocked && !isGhost
          ? `linear-gradient(135deg, ${palette.bgLight}, ${palette.bgDark})`
          : palette.bgLocked,
        transform: isPrimary ? 'translateY(-2px)' : undefined,
        opacity: isGhost ? 0.7 : (!unlocked ? 0.75 : 1),
      }}
    >
      {/* Ghost overlay */}
      {isGhost && (
        <div className="absolute inset-0 rounded-[inherit] bg-white/40 pointer-events-none" />
      )}

      {/* Row 1: Tier band pill + Status chip */}
      <div className="flex items-center justify-between">
        {/* Tier band pill */}
        <div 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
          style={{ 
            backgroundColor: unlocked ? `${palette.accent}20` : 'rgba(148,163,184,0.15)',
            color: unlocked ? palette.accent : '#64748b',
          }}
        >
          {tierLabel}
        </div>
        
        {/* Status chip */}
        <div className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium",
          unlocked && !isGhost
            ? "bg-white/80 text-slate-700"
            : "bg-white/50 text-slate-500"
        )}>
          {statusLabel}
        </div>
      </div>

      {/* Row 2: Hero stat block - large number */}
      <div className="flex flex-col items-center justify-center flex-1 -mt-1">
        <span 
          className="text-[32px] font-bold leading-none tracking-tight"
          style={{ color: unlocked ? palette.accent : '#94a3b8' }}
        >
          {heroValue}
        </span>
        <span className="text-[11px] font-medium text-slate-600/80 mt-0.5">
          {heroLabel}
        </span>
      </div>

      {/* Row 3: Trophy icon + Club name */}
      <div className="flex items-center gap-1.5">
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: unlocked ? `${palette.accent}18` : 'rgba(148,163,184,0.10)' 
          }}
        >
          <Trophy 
            className="w-2.5 h-2.5"
            style={{ color: unlocked ? palette.accent : '#94a3b8' }} 
          />
        </div>
        <span className="text-[11px] font-medium text-slate-700 truncate">
          {clubName}
        </span>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;
