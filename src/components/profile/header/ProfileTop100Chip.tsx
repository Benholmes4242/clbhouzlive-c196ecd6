import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import ProfileCompletionStamps from './ProfileCompletionStamps';
import { getCompletionStamps } from '@/lib/top100Helpers';
import type { Top100ListProgress } from '@/lib/top100Helpers';

// Tier-specific glass plaque styles
const TIER_STYLES: Record<string, {
  bg: string;
  border: string;
  accent: string;
}> = {
  founders: {
    bg: 'from-emerald-500/22 via-emerald-500/12 to-emerald-500/6',
    border: 'border-emerald-400/55',
    accent: 'text-emerald-600',
  },
  rookie: {
    bg: 'from-amber-500/20 via-amber-500/10 to-amber-500/5',
    border: 'border-amber-400/50',
    accent: 'text-amber-600',
  },
  fairway: {
    bg: 'from-lime-500/20 via-lime-500/10 to-lime-500/5',
    border: 'border-lime-400/50',
    accent: 'text-lime-600',
  },
  heritage: {
    bg: 'from-yellow-500/20 via-yellow-500/10 to-yellow-500/5',
    border: 'border-yellow-400/50',
    accent: 'text-yellow-600',
  },
  century: {
    bg: 'from-slate-400/20 via-slate-400/10 to-slate-400/5',
    border: 'border-slate-300/50',
    accent: 'text-slate-600',
  },
  elite: {
    bg: 'from-orange-500/20 via-orange-500/10 to-orange-500/5',
    border: 'border-orange-400/50',
    accent: 'text-orange-600',
  },
  legendary: {
    bg: 'from-purple-500/20 via-purple-500/10 to-purple-500/5',
    border: 'border-purple-400/50',
    accent: 'text-purple-600',
  },
  grandslam: {
    bg: 'from-slate-800/30 via-slate-800/15 to-slate-800/5',
    border: 'border-slate-600/50',
    accent: 'text-slate-800',
  },
};

const DEFAULT_TIER_STYLE = {
  bg: 'from-emerald-500/22 via-emerald-500/12 to-emerald-500/6',
  border: 'border-emerald-400/55',
  accent: 'text-emerald-600',
};

interface Top100Overview {
  total_rated?: number;
  total_played?: number;
  regions_count: number;
  lists?: Top100ListProgress[];
}

interface ProfileTop100ChipProps {
  top100Overview: Top100Overview | null | undefined;
  isPersonal: boolean;
  isMobile?: boolean;
}

/**
 * ProfileTop100Chip - Premium Golf glass plaque with tier-specific styling
 * Hero item between stats and tabs
 */
const ProfileTop100Chip: React.FC<ProfileTop100ChipProps> = ({
  top100Overview,
  isPersonal,
  isMobile = false,
}) => {
  const navigate = useNavigate();

  // Only show for personal profiles with Top 100 progress
  if (!isPersonal || !top100Overview) return null;
  
  const totalPlayed = top100Overview.total_rated ?? top100Overview.total_played ?? 0;
  if (totalPlayed === 0) return null;
  
  const club = getTop100Club(totalPlayed);
  const completionStamps = getCompletionStamps(top100Overview.lists);
  const regionsCount = top100Overview.regions_count ?? 0;
  
  // Get tier-specific styling
  const tierId = club.tierId ?? '';
  const style = TIER_STYLES[tierId] ?? DEFAULT_TIER_STYLE;

  return (
    <div className="px-4 mt-6">
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          // Size & layout
          'group flex w-full max-w-[360px] mx-auto items-center justify-between gap-3',
          // Shape
          'rounded-[26px] px-4 py-3',
          // Glass effect with tier-specific gradient
          'bg-gradient-to-br backdrop-blur-xl',
          style.bg,
          style.border,
          'border shadow-[0_18px_45px_rgba(0,0,0,0.30)]',
          // Interaction
          'transition-transform duration-150 active:scale-[0.98]'
        )}
      >
        {/* Left: white icon squircle */}
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 text-emerald-500 shadow-sm">
          <Trophy className="h-5 w-5" />
        </div>

        {/* Center text */}
        <div className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-[15px] font-semibold text-slate-900">
            {totalPlayed} Top 100
          </span>
          <span className={cn('truncate text-[12px] font-medium', style.accent)}>
            {club.shortLabel || 'Founders'}{regionsCount > 0 ? ` · ${regionsCount} regions` : ''}
          </span>
        </div>

        {/* Arrow */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-700 group-hover:bg-white/90 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>
      
      {/* Completion stamps row */}
      {completionStamps.length > 0 && (
        <div className="mt-2">
          <ProfileCompletionStamps stamps={completionStamps} />
        </div>
      )}
    </div>
  );
};

export default ProfileTop100Chip;
