import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import MilestonesAndAchievementsModal from '@/components/achievements/MilestonesAndAchievementsModal';
import { getNextBadgeNudge, type BadgeNudge } from '@/lib/achievements/nextBadgeNudge';

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

// Get ghost card tier from nudge
function getGhostTier(nudge: BadgeNudge): AchievementTier {
  if (nudge.type === 'global') {
    return nudge.nextThreshold.toString() as AchievementTier;
  }
  return nudge.regionId;
}

/**
 * ProfileAchievementsRail - Strava-style horizontal trophy strip
 * Shows all unlocked milestone and list completion achievements
 * Business rule: Users keep and display ALL earned badges, not just highest
 * Now includes ghost card for "next badge" nudge system
 */
const ProfileAchievementsRail: React.FC<ProfileAchievementsRailProps> = ({
  userId,
  username,
  className,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: achievements, isLoading } = useProfileAchievements(userId);
  const { data: progressData } = useTop100ProgressForUser(userId);

  // Calculate nudge for ghost card
  const nudge = progressData?.lists ? getNextBadgeNudge({
    totalTop100Played: progressData.totalTop100Played,
    lists: progressData.lists.map(l => {
      const regionMap: Record<string, 'GBI' | 'USA' | 'EU' | 'WORLD'> = {
        'gb-i': 'GBI',
        'usa': 'USA',
        'europe': 'EU',
        'global': 'WORLD',
      };
      return {
        regionId: regionMap[l.listSlug] || 'WORLD',
        played: l.played,
        total: l.total,
      };
    }),
  }) : null;

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

  // Show ghost card only if nudge exists and there are already some achievements
  const showGhostCard = nudge && visible.length > 0;

  if (isLoading || (visible.length === 0 && !nudge)) return null;

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
              totalTop100Played={progressData?.totalTop100Played}
              compact
            />
          ))}

          {/* Ghost card for next badge */}
          {showGhostCard && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="shrink-0"
            >
              <AchievementBadgeCard
                tier={getGhostTier(nudge)}
                title={nudge.type === 'global' 
                  ? `${nudge.nextThreshold} Club` 
                  : `${nudge.regionLabel}`}
                subtitle={`${nudge.remaining} away`}
                unlocked={false}
                isGhost={true}
                compact
              />
            </button>
          )}
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
