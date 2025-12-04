import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MapPin, ChevronRight } from 'lucide-react';
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
 * ProfileTop100Chip - Compact Top 100 summary with progress and completion stamps
 * Shows total courses played, regions count, club tier, and any completion stamps
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

  return (
    <div className={cn("flex flex-col items-center gap-2", isMobile ? "mt-3" : "mt-4")}>
      {/* Main Top 100 chip */}
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          "group inline-flex items-center gap-3 rounded-2xl",
          "border border-white/10 bg-slate-900/80 backdrop-blur-sm",
          "px-4 py-2.5",
          "hover:border-white/20 hover:bg-slate-800/80",
          "transition-all duration-200 ease-out",
          "shadow-lg shadow-black/20"
        )}
      >
        {/* Trophy icon with tier color glow */}
        <div 
          className="relative flex items-center justify-center w-8 h-8 rounded-full"
          style={{ 
            backgroundColor: `${club.ringColor}20`,
            boxShadow: `0 0 12px ${club.ringColor}30`
          }}
        >
          <Trophy className="h-4 w-4" style={{ color: club.ringColor }} />
        </div>
        
        {/* Content */}
        <div className="flex flex-col items-start leading-tight">
          <span className="font-semibold text-sm text-white">
            {totalPlayed} Top 100
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {top100Overview.regions_count > 0 && (
              <>
                <MapPin className="w-2.5 h-2.5" />
                {top100Overview.regions_count} {top100Overview.regions_count === 1 ? 'region' : 'regions'}
              </>
            )}
            {club.shortLabel && (
              <>
                {top100Overview.regions_count > 0 && <span className="text-slate-600">·</span>}
                <span 
                  className="font-medium"
                  style={{ color: club.ringColor }}
                >
                  {club.shortLabel}
                </span>
              </>
            )}
          </span>
        </div>
        
        {/* Arrow indicator */}
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
      </button>
      
      {/* Completion stamps row */}
      {completionStamps.length > 0 && (
        <ProfileCompletionStamps stamps={completionStamps} />
      )}
    </div>
  );
};

export default ProfileTop100Chip;
