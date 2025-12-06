import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
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
 * ProfileTop100Chip - Premium glass badge with tier-colored medallion
 * Only renders if user has at least 5 Top 100 courses
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
  
  // Only show if user has first achievement (5+ courses)
  if (totalPlayed < 5) return null;
  
  const club = getTop100Club(totalPlayed);
  const tierColor = club.ringColor || '#22c55e';
  const completionStamps = getCompletionStamps(top100Overview.lists);

  return (
    <section className="mt-6 flex flex-col items-center">
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          'mx-auto flex w-[82%] max-w-[360px] items-center justify-between',
          'rounded-[24px] bg-white/70 px-4 py-3',
          'shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-md',
          'transition-all duration-200 ease-out',
          'active:scale-[0.98] hover:scale-[1.01]'
        )}
      >
        {/* Left side: count + label */}
        <div className="flex flex-col text-left">
          <div className="flex items-baseline gap-1 text-[15px]">
            <span className="font-semibold text-slate-900">{totalPlayed}</span>
            <span className="text-foreground/80">Top 100</span>
          </div>
          <span 
            className="mt-0.5 text-[12px] font-medium"
            style={{ color: tierColor }}
          >
            {club.tierName} Club
          </span>
        </div>

        {/* Glass medallion with tier color */}
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-[16px] shadow-[0_12px_32px_rgba(0,0,0,0.32)]"
          style={{
            background:
              `radial-gradient(circle at 20% 0, rgba(255,255,255,0.90), transparent 52%),` +
              `linear-gradient(135deg, ${tierColor}, ${tierColor}CC)`,
          }}
        >
          <div className="absolute inset-[1.5px] rounded-[14px] border border-white/55" />
          <Trophy className="relative h-5 w-5 text-white" />
        </div>
      </button>
      
      {/* Completion stamps row */}
      {completionStamps.length > 0 && (
        <div className="mt-2">
          <ProfileCompletionStamps stamps={completionStamps} />
        </div>
      )}
    </section>
  );
};

export default ProfileTop100Chip;