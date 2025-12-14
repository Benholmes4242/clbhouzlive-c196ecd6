import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import { getNextBadgeNudge, type BadgeNudge } from '@/lib/achievements/nextBadgeNudge';

interface ProfileAchievementsRailProps {
  userId: string;
  username: string;
  className?: string;
}

const MAX_VISIBLE = 12;

// V1 Polish: Calm motion easing
const POLISH_TRANSITION = 'all 220ms cubic-bezier(0.4, 0.0, 0.2, 1)';

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
 * 
 * V1 Polish Pass:
 * - Soft plinth-style containers (reduced radius, no heavy borders)
 * - Unlocked: subtle etched tick, no "Unlocked" pill
 * - Locked: 20-30% opacity + frosted blur
 * - Slight overlap into hero area
 * - Calm motion transitions
 */
const ProfileAchievementsRail: React.FC<ProfileAchievementsRailProps> = ({
  userId,
  username,
  className,
}) => {
  const navigate = useNavigate();
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

  // Sort by newest first
  const sortedAchievements = [...achievements].sort((a, b) => {
    const aDate = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
    const bDate = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
    if (aDate !== bDate) return bDate - aDate;
    const aVal = a.threshold ?? 0;
    const bVal = b.threshold ?? 0;
    return bVal - aVal;
  });

  const visible = sortedAchievements.slice(0, MAX_VISIBLE);
  const showGhostCard = nudge && visible.length > 0;

  const handleViewAll = () => {
    navigate('/achievements');
  };

  if (isLoading || (visible.length === 0 && !nudge)) return null;

  return (
    <section
      className={cn("px-4", className)}
      aria-label="Achievements"
      style={{ transition: POLISH_TRANSITION }}
    >
      {/* Title row */}
      <div className="mb-2 flex items-center justify-between">
        <h2 
          className="text-sm font-semibold"
          style={{ color: 'var(--dgp-text-primary, hsl(var(--foreground)))' }}
        >
          Achievements
        </h2>
        <button
          type="button"
          onClick={handleViewAll}
          className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80"
          style={{ 
            color: 'var(--dgp-accent-green, hsl(var(--primary)))',
            transition: POLISH_TRANSITION,
          }}
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Horizontal scroll strip - soft plinth containers */}
      <div 
        className="flex gap-2.5 overflow-x-auto pb-1 pt-2 [-webkit-overflow-scrolling:touch] scrollbar-hide -mx-4 px-4"
        style={{ transition: POLISH_TRANSITION }}
      >
        {visible.map((ach, index) => (
          <div
            key={ach.id}
            className="shrink-0"
            style={{ transition: POLISH_TRANSITION }}
          >
            <AchievementBadgeCard
              tier={getAchievementTier(ach)}
              title={ach.shortLabel}
              subtitle={ach.type === 'milestone' ? 'Milestone' : 'Completed'}
              unlocked={true}
              isPrimary={index === 0}
              totalTop100Played={progressData?.totalTop100Played}
              compact
            />
          </div>
        ))}

        {/* Ghost card for next badge - locked style */}
        {showGhostCard && (
          <button
            type="button"
            onClick={handleViewAll}
            className="shrink-0"
            style={{ transition: POLISH_TRANSITION }}
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
  );
};

export default ProfileAchievementsRail;
