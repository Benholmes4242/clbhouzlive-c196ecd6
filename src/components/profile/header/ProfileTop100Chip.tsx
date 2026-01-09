import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
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
 * ProfileTop100Chip - Part of Global Achievement & Milestone System
 * 
 * Uses the unified EliteGameCard component with colors from
 * globalAchievementMilestoneSystem.ts to match all other achievement displays.
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
  
  // Map threshold to EliteCardTier
  const eliteTier = club.threshold?.toString() as EliteCardTier || '5';

  return (
    <section className="mt-8 flex flex-col items-center">
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          'relative flex items-center justify-center',
          'transition-all duration-200 ease-out',
          'active:scale-[0.98]',
          'hover:scale-[1.01]'
        )}
      >
        <EliteGameCard
          tier={eliteTier}
          earned={true}
          currentProgress={totalPlayed}
          targetProgress={club.threshold}
          title={`${totalPlayed} Top 100`}
          subtitle={club.tierName || 'Top 100 Club'}
          compact={true}
          enableAnimations={false}
          quality="low"
        />
        <ChevronRight className="absolute -right-7 h-5 w-5 text-slate-400" />
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
