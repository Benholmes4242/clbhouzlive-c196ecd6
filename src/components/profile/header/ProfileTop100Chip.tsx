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
 * ProfileTop100Chip - Glassy Top 100 summary card with tier halo
 * Shows total courses played, regions count, club tier, and completion stamps
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
      {/* Glassy Top 100 chip */}
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          "group inline-flex items-center gap-3 rounded-2xl",
          "border border-white/25 backdrop-blur-md",
          "px-4 py-3",
          "bg-white/10",
          "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
          "hover:border-white/35 hover:bg-white/15",
          "transition-all duration-200 ease-out",
          "active:scale-[0.98]"
        )}
      >
        {/* Trophy icon with tier color halo */}
        <span className="relative inline-flex items-center justify-center">
          {/* Conic gradient halo effect */}
          <span
            className="absolute inset-0 rounded-full opacity-70 blur-[4px]"
            style={{
              background: `conic-gradient(from 0deg, ${club.ringColor}b3, rgba(255,255,255,0.2), ${club.ringColor}b3)`,
            }}
          />
          <span 
            className="relative inline-flex items-center justify-center rounded-full w-7 h-7"
            style={{ backgroundColor: `${club.ringColor}20` }}
          >
            <Trophy className="w-4 h-4" style={{ color: club.ringColor }} />
          </span>
        </span>
        
        {/* Content */}
        <div className="flex flex-col items-start leading-tight">
          <span className="font-semibold text-sm text-foreground">
            {totalPlayed} Top 100
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            {top100Overview.regions_count > 0 && (
              <>
                <MapPin className="w-2.5 h-2.5" />
                {top100Overview.regions_count} {top100Overview.regions_count === 1 ? 'region' : 'regions'}
              </>
            )}
            {club.shortLabel && (
              <>
                {top100Overview.regions_count > 0 && <span className="opacity-50">·</span>}
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
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </button>
      
      {/* Completion stamps row */}
      {completionStamps.length > 0 && (
        <ProfileCompletionStamps stamps={completionStamps} />
      )}
    </div>
  );
};

export default ProfileTop100Chip;
