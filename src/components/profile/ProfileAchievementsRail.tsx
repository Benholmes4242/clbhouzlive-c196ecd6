import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import MilestonesAndAchievementsModal from '@/components/achievements/MilestonesAndAchievementsModal';

interface ProfileAchievementsRailProps {
  userId: string;
  username: string;
  className?: string;
}

const MAX_VISIBLE = 12;

// Map achievement IDs to AchievementTier
function getAchievementTier(achievement: { id: string; threshold?: number; type: string }): AchievementTier {
  // Milestones
  if (achievement.type === 'milestone' && achievement.threshold) {
    return achievement.threshold.toString() as AchievementTier;
  }
  // List completions
  if (achievement.id === 'list_gb_ireland') return 'GBI';
  if (achievement.id === 'list_europe') return 'EU';
  if (achievement.id === 'list_usa') return 'USA';
  if (achievement.id === 'list_worldwide') return 'WORLD';
  // Default fallback
  return '5';
}

/**
 * ProfileAchievementsRail - Strava-style horizontal trophy strip
 * Shows all unlocked milestone and list completion achievements
 * Business rule: Users keep and display ALL earned badges, not just highest
 */
const ProfileAchievementsRail: React.FC<ProfileAchievementsRailProps> = ({
  userId,
  username,
  className,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: achievements, isLoading } = useProfileAchievements(userId);

  // Sort by newest first: use unlockedAt date if available, else higher thresholds first
  // This shows most recently earned achievements on the left
  const sortedAchievements = [...achievements].sort((a, b) => {
    // First, sort by unlock date (newest first) if available
    const aDate = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
    const bDate = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
    if (aDate !== bDate) return bDate - aDate;
    
    // Fallback: higher thresholds (bigger milestones) first
    const aVal = a.threshold ?? 0;
    const bVal = b.threshold ?? 0;
    return bVal - aVal;
  });

  // Cap visible to MAX_VISIBLE
  const visible = sortedAchievements.slice(0, MAX_VISIBLE);

  if (isLoading || visible.length === 0) return null;

  return (
    <>
      <section
        className={cn("px-4", className)}
        aria-label="Achievements"
      >
        {/* Title row */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Achievements
          </h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Horizontal scroll strip with shared AchievementBadgeCard */}
        <div className="flex gap-3 overflow-x-auto pb-1 pt-2 [-webkit-overflow-scrolling:touch] scrollbar-hide -mx-4 px-4">
          {visible.map((ach, index) => (
            <AchievementBadgeCard
              key={ach.id}
              tier={getAchievementTier(ach)}
              title={ach.shortLabel}
              subtitle={ach.type === 'milestone' ? 'Milestone' : 'Completed'}
              unlocked={true}
              isPrimary={index === 0}
            />
          ))}
        </div>
      </section>

      {/* Top 100 Milestones Modal */}
      <MilestonesAndAchievementsModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
};

export default ProfileAchievementsRail;
