import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import { AchievementBadge } from '@/components/achievements/AchievementBadge';
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
 * ProfileTop100Chip - Uses the Apple Glass Ultra AchievementBadge
 * Only renders if user has at least 5 Top 100 courses (first achievement)
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
  const completionStamps = getCompletionStamps(top100Overview.lists);

  return (
    <div className="px-4 mt-6">
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          'w-full max-w-[360px] mx-auto',
          'flex items-center gap-2',
          'transition-all duration-200 ease-out',
          'active:scale-[0.98]',
          'hover:scale-[1.01]'
        )}
      >
        <AchievementBadge
          count={totalPlayed}
          title="Top 100"
          tierLabel={club.tierName || 'Top 100 Club'}
          ringColor={club.ringColor}
          size="md"
          className="flex-1"
        />
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
