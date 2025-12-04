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
 * ProfileTop100Chip - Premium plaque with tier halo trophy
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
      {/* Premium Plaque */}
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          "group w-full max-w-[320px]",
          "inline-flex items-center justify-between",
          "rounded-2xl px-4 py-3",
          "bg-white/10 border border-white/25",
          "backdrop-blur-md",
          "shadow-[0_10px_30px_rgba(0,0,0,0.30)]",
          "hover:bg-white/15 hover:border-white/35",
          "active:scale-[0.98]",
          "transition-all duration-200"
        )}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Trophy icon with tier colour halo */}
          <div className="relative flex items-center justify-center">
            {/* Conic gradient halo */}
            <div
              className="absolute inset-0 rounded-full opacity-60 blur-[6px]"
              style={{
                background: `conic-gradient(from 0deg, ${club.ringColor}, transparent 50%, ${club.ringColor})`,
              }}
            />
            <div 
              className="relative flex items-center justify-center rounded-full w-9 h-9"
              style={{ backgroundColor: `${club.ringColor}25` }}
            >
              <Trophy 
                className="w-5 h-5" 
                style={{ color: club.ringColor }} 
              />
            </div>
          </div>
          
          {/* Text group */}
          <div className="flex flex-col items-start">
            <span className="font-medium tracking-tight text-foreground">
              {totalPlayed} Top 100
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {top100Overview.regions_count > 0 && (
                <>
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{top100Overview.regions_count} {top100Overview.regions_count === 1 ? 'region' : 'regions'}</span>
                </>
              )}
              {club.shortLabel && (
                <>
                  {top100Overview.regions_count > 0 && <span className="opacity-50">·</span>}
                  <span style={{ color: club.ringColor }}>
                    {club.shortLabel}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
        
        {/* Right Section - Chevron */}
        <ChevronRight 
          className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" 
        />
      </button>
      
      {/* Completion stamps row */}
      {completionStamps.length > 0 && (
        <ProfileCompletionStamps stamps={completionStamps} />
      )}
    </div>
  );
};

export default ProfileTop100Chip;
