import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTierPalette } from '@/lib/globalAchievementMilestoneSystem';

export type AchievementStatus = 'UNLOCKED' | 'LOCKED';
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

export interface AchievementBadgeCardProps {
  tier: AchievementTier;
  title: string;        // e.g. "20 Club"
  subtitle: string;     // e.g. "Founders Club" or "Milestone"
  unlocked: boolean;
  isPrimary?: boolean;  // used to slightly emphasise current / latest
  unlockedAt?: string;
  remaining?: number;   // For locked cards, show "X away"
  compact?: boolean;    // Compact variant for tight spaces
}

/**
 * AchievementBadgeCard - Global Achievement & Milestone System
 * 
 * The canonical shared card component for ALL achievement displays across the app.
 * Colors derived from globalAchievementMilestoneSystem.ts:
 * - Trophy icon: pure accent color (same as avatar rings)
 * - Background: soft gradient from bgLight → bgDark
 * 
 * Usage: Profile rail, Milestones Modal, Top 100 Hub, My Progress, regional lists
 */
export const AchievementBadgeCard: React.FC<AchievementBadgeCardProps> = ({
  tier,
  title,
  subtitle,
  unlocked,
  isPrimary = false,
  remaining,
  compact = false,
}) => {
  const palette = getTierPalette(tier, unlocked);

  return (
    <div
      className={cn(
        'rounded-3xl flex flex-col justify-between transition-all duration-150',
        'border',
        unlocked 
          ? 'border-transparent shadow-[0_10px_30px_rgba(15,23,42,0.12)]' 
          : 'border-slate-200/70 shadow-sm',
        // Micro-interactions
        'active:scale-[0.97]',
        unlocked && 'hover:shadow-[0_16px_40px_rgba(16,185,129,0.18)]',
        // Size variants
        compact 
          ? 'min-w-[140px] px-3 py-2.5' 
          : 'min-w-[160px] px-4 py-3'
      )}
      style={{
        background: unlocked
          ? `linear-gradient(145deg, ${palette.bgLight}, ${palette.bgDark})`
          : palette.bgLocked,
        transform: isPrimary ? 'translateY(-2px)' : undefined,
      }}
    >
      {/* Icon row */}
      <div className="flex justify-between items-start mb-2">
        <div
          className={cn(
            "rounded-full flex items-center justify-center shadow-sm",
            compact ? "h-8 w-8" : "h-9 w-9"
          )}
          style={{
            // Use accent color at 15% opacity for subtle background that matches ring color
            backgroundColor: unlocked ? `${palette.accent}26` : 'rgba(255,255,255,0.8)',
          }}
        >
          {/* Trophy icon uses pure accent color - same as avatar rings */}
          <Trophy 
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            style={{ color: palette.accent }} 
          />
        </div>
        {unlocked ? (
          <span className="text-[11px] font-medium text-emerald-700/80 bg-white/70 px-2 py-[2px] rounded-full">
            Unlocked
          </span>
        ) : remaining !== undefined ? (
          <span className="text-[11px] font-medium text-slate-500 bg-white/80 px-2 py-[2px] rounded-full">
            {remaining} away
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 bg-white/60 px-2 py-[2px] rounded-full">
            Locked
          </span>
        )}
      </div>

      {/* Text */}
      <div className="space-y-[2px] mt-1">
        <div className={cn(
          "font-semibold text-slate-900",
          compact ? "text-xs" : "text-sm"
        )}>
          {title}
        </div>
        <div className={cn(
          "text-slate-700/80",
          compact ? "text-[10px]" : "text-[11px]"
        )}>
          {subtitle}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;
