import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club, glassTint } from '@/lib/top100Club';
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
  
  // Get tier-specific glass color
  const glassBackground = glassTint(club.ringColor, 0.18);
  const glassBorder = glassTint(club.ringColor, 0.45);
  const glassHover = glassTint(club.ringColor, 0.28);
  const glassShadow = glassTint(club.ringColor, 0.25);
  const glassShadowHover = glassTint(club.ringColor, 0.35);
  
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
          // Glass effect
          'backdrop-blur-xl',
          // Interaction
          'transition-all duration-200 ease-out',
          'active:scale-[0.98]'
        )}
        style={{
          background: glassBackground,
          border: `1px solid ${glassBorder}`,
          boxShadow: `0 18px 45px ${glassShadow}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = glassHover;
          e.currentTarget.style.boxShadow = `0 22px 55px ${glassShadowHover}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = glassBackground;
          e.currentTarget.style.boxShadow = `0 18px 45px ${glassShadow}`;
        }}
      >
        {/* Left icon disc */}
        <div 
          className="relative flex items-center justify-center w-10 h-10 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: club.ringColor }}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white">
            <Trophy className="h-4 w-4" style={{ color: club.ringColor }} />
          </span>
        </div>

        {/* Text block */}
        <div className="flex flex-col text-left flex-1 min-w-0">
          <span className="text-[15px] md:text-[16px] font-semibold text-foreground truncate">
            {totalPlayed} Top 100
          </span>
          {subtitleParts.length > 0 && (
            <span 
              className="mt-0.5 text-[12px] opacity-90"
              style={{ color: club.ringColor }}
            >
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
