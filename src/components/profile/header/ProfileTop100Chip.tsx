import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import ProfileCompletionStamps from './ProfileCompletionStamps';
import { getCompletionStamps } from '@/lib/top100Helpers';
import type { Top100ListProgress } from '@/lib/top100Helpers';

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
 * ProfileTop100Chip - Premium Golf plaque with emerald gradient
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
  
  // Build subtitle parts
  const subtitleParts: string[] = [];
  if (club.shortLabel) {
    subtitleParts.push(club.shortLabel);
  }
  if (regionsCount > 0) {
    subtitleParts.push(`${regionsCount} ${regionsCount === 1 ? 'region' : 'regions'}`);
  }

  return (
    <div className="px-4 mt-6">
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          // Size & layout
          'w-full max-w-[360px] mx-auto',
          'flex items-center gap-3',
          'px-4 py-3 md:px-5 md:py-3.5',
          'rounded-2xl',
          // Background & border (Green glass plaque)
          'bg-emerald-500/20',
          'border border-emerald-400/40 shadow-[0_18px_45px_rgba(16,185,129,0.25)]',
          'backdrop-blur-xl',
          // Interaction
          'transition-all duration-200 ease-out',
          'hover:bg-emerald-500/28 hover:border-emerald-400/60 hover:shadow-[0_22px_55px_rgba(16,185,129,0.35)]',
          'active:scale-[0.98]'
        )}
      >
        {/* Left icon disc */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/90 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600">
            <Trophy className="h-4 w-4" />
          </span>
        </div>

        {/* Text block */}
        <div className="flex flex-col text-left flex-1 min-w-0">
          <span className="text-[15px] md:text-[16px] font-semibold text-foreground truncate">
            {totalPlayed} Top 100
          </span>
          {subtitleParts.length > 0 && (
            <span className="mt-0.5 text-[12px] text-emerald-400/90">
              {subtitleParts.join(' · ')}
            </span>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center justify-center">
          <ChevronRight className="h-4 w-4 text-foreground/60" />
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
