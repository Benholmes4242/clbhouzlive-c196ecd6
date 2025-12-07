import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

// Colour palette for each tier
interface TierPalette {
  bgLight: string;
  bgDark: string;
  bgLocked: string;
  icon: string;
}

function getTierPalette(tier: AchievementTier, unlocked: boolean): TierPalette {
  // Locked palette is the same for all
  const lockedPalette: TierPalette = {
    bgLight: 'hsl(210 20% 98%)',
    bgDark: 'hsl(210 15% 94%)',
    bgLocked: 'hsl(210 15% 96%)',
    icon: 'hsl(215 15% 65%)',
  };

  if (!unlocked) return lockedPalette;

  // Unlocked palettes per tier
  const palettes: Record<AchievementTier, TierPalette> = {
    // Milestones
    '5': {
      bgLight: 'hsl(43 45% 95%)',
      bgDark: 'hsl(43 40% 88%)',
      bgLocked: 'hsl(43 30% 96%)',
      icon: '#C9B27A',
    },
    '10': {
      bgLight: 'hsl(115 40% 95%)',
      bgDark: 'hsl(115 35% 88%)',
      bgLocked: 'hsl(115 30% 96%)',
      icon: '#7CC66B',
    },
    '20': {
      bgLight: 'hsl(122 35% 93%)',
      bgDark: 'hsl(122 40% 82%)',
      bgLocked: 'hsl(122 30% 96%)',
      icon: '#2F7D32',
    },
    '50': {
      bgLight: 'hsl(42 60% 94%)',
      bgDark: 'hsl(42 55% 85%)',
      bgLocked: 'hsl(42 40% 96%)',
      icon: '#D8A546',
    },
    '100': {
      bgLight: 'hsl(0 0% 96%)',
      bgDark: 'hsl(0 0% 88%)',
      bgLocked: 'hsl(0 0% 96%)',
      icon: '#4A4A4A',
    },
    '200': {
      bgLight: 'hsl(250 50% 96%)',
      bgDark: 'hsl(250 45% 88%)',
      bgLocked: 'hsl(250 30% 96%)',
      icon: '#6F5BD5',
    },
    '300': {
      bgLight: 'hsl(290 45% 95%)',
      bgDark: 'hsl(290 40% 88%)',
      bgLocked: 'hsl(290 30% 96%)',
      icon: '#B153CE',
    },
    '400': {
      bgLight: 'hsl(0 0% 94%)',
      bgDark: 'hsl(0 0% 84%)',
      bgLocked: 'hsl(0 0% 96%)',
      icon: '#111111',
    },
    // List completions
    'GBI': {
      bgLight: 'hsl(210 50% 95%)',
      bgDark: 'hsl(210 45% 88%)',
      bgLocked: 'hsl(210 30% 96%)',
      icon: '#1E3A5F',
    },
    'EU': {
      bgLight: 'hsl(263 50% 96%)',
      bgDark: 'hsl(263 45% 88%)',
      bgLocked: 'hsl(263 30% 96%)',
      icon: '#7C3AED',
    },
    'USA': {
      bgLight: 'hsl(0 55% 96%)',
      bgDark: 'hsl(0 50% 90%)',
      bgLocked: 'hsl(0 30% 96%)',
      icon: '#B91C1C',
    },
    'WORLD': {
      bgLight: 'hsl(175 50% 94%)',
      bgDark: 'hsl(175 45% 86%)',
      bgLocked: 'hsl(175 30% 96%)',
      icon: '#0D9488',
    },
  };

  return palettes[tier];
}

/**
 * Shared achievement badge card for Profile rail and Top 100 Milestones Modal
 * Premium Apple-level design with tier-based gradients
 */
export const AchievementBadgeCard: React.FC<AchievementBadgeCardProps> = ({
  tier,
  title,
  subtitle,
  unlocked,
  isPrimary = false,
  unlockedAt,
}) => {
  const palette = getTierPalette(tier, unlocked);

  return (
    <div
      className={cn(
        'rounded-[24px] px-4 py-3 min-w-[130px] flex flex-col justify-between transition-all duration-150',
        'border',
        unlocked 
          ? 'border-transparent shadow-[0_10px_30px_rgba(15,23,42,0.12)]' 
          : 'border-slate-200/70 shadow-sm',
        // Micro-interactions
        'active:scale-[0.97]',
        unlocked && 'hover:shadow-[0_16px_40px_rgba(16,185,129,0.18)]'
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
          className="h-9 w-9 rounded-2xl flex items-center justify-center bg-white/80 shadow-sm"
        >
          <Trophy 
            className="h-4 w-4" 
            style={{ color: palette.icon }} 
          />
        </div>
        {unlocked && (
          <span className="text-[11px] font-medium text-emerald-700/80 bg-white/70 px-2 py-[2px] rounded-full">
            Unlocked
          </span>
        )}
      </div>

      {/* Text */}
      <div className="space-y-[2px] mt-1">
        <div className="text-sm font-semibold text-slate-900">
          {title}
        </div>
        <div className="text-[11px] text-slate-700/80">
          {subtitle}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeCard;
