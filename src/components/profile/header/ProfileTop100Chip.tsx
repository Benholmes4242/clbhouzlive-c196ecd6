import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingDotClass } from '@/lib/top100RingStyles';

interface Top100Overview {
  total_rated?: number;
  total_played?: number;
  regions_count: number;
}

interface ProfileTop100ChipProps {
  top100Overview: Top100Overview | null | undefined;
  isPersonal: boolean;
}

/**
 * ProfileTop100Chip - Displays Top 100 progress chip for personal profiles only
 * Shows total courses rated, regions count, and club tier
 */
const ProfileTop100Chip: React.FC<ProfileTop100ChipProps> = ({
  top100Overview,
  isPersonal
}) => {
  const navigate = useNavigate();

  // Only show for personal profiles with Top 100 progress
  if (!isPersonal || !top100Overview) return null;
  
  const totalRated = top100Overview.total_rated ?? top100Overview.total_played ?? 0;
  if (totalRated === 0) return null;
  
  const club = getTop100Club(totalRated);
  const ringDotClass = getTop100RingDotClass(club.tierId);

  return (
    <div className="mt-3 flex justify-center">
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-200 hover:border-slate-600 hover:text-slate-50 transition-colors"
      >
        <Trophy className="h-3.5 w-3.5 text-amber-400" />
        <span className="flex flex-col leading-tight text-left">
          <span className="font-medium uppercase text-[10px] tracking-wide">TOP 100 JOURNEY</span>
          <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
            {totalRated} course{totalRated === 1 ? '' : 's'}
            {top100Overview.regions_count > 0 && (
              <>
                <span className="text-slate-500">·</span>
                {top100Overview.regions_count} {top100Overview.regions_count === 1 ? 'region' : 'regions'}
              </>
            )}
            {club.shortLabel && (
              <>
                <span className="text-slate-500">·</span>
                <span className="inline-flex items-center gap-1">
                  <span className={cn('h-1.5 w-1.5 rounded-full', ringDotClass)} />
                  {club.shortLabel}
                </span>
              </>
            )}
          </span>
        </span>
      </button>
    </div>
  );
};

export default ProfileTop100Chip;
