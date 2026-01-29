import React, { useMemo } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { getNextBadgeNudge, type BadgeNudge } from '@/lib/achievements/nextBadgeNudge';

// Import badge images
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';
import globalBadgeImage from '@/assets/badges/global-badge.png';
import gbiBadgeImage from '@/assets/badges/gbi-badge.png';
import europeBadgeImage from '@/assets/badges/europe-badge.png';
import usaBadgeImage from '@/assets/badges/usa-badge.png';

interface ProfileAchievementsRailProps {
  userId: string;
  username: string;
  className?: string;
}

// Badge image mapping for milestones
const MILESTONE_BADGE_IMAGES: Record<number, string> = {
  5: rookieBadgeImage,
  10: fairwayBadgeImage,
  20: foundersBadgeImage,
  50: heritageBadgeImage,
  100: centuryBadgeImage,
  200: eliteBadgeImage,
  300: legendaryBadgeImage,
  400: grandslamBadgeImage,
};

// Badge image mapping for list completions
const LIST_BADGE_IMAGES: Record<string, string> = {
  'list_gb_ireland': gbiBadgeImage,
  'list_europe': europeBadgeImage,
  'list_usa': usaBadgeImage,
  'list_worldwide': globalBadgeImage,
};

// Club names for each threshold (matching Trophy Case)
const CLUB_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

// Region names for list completions
const REGION_NAMES: Record<string, string> = {
  'list_gb_ireland': 'GB&I Top 100',
  'list_europe': 'Europe Top 100',
  'list_usa': 'USA Top 100',
  'list_worldwide': 'Global Top 100',
};

// Get badge image for achievement
function getBadgeImage(achievement: { id: string; threshold?: number; type: string }): string | undefined {
  if (achievement.type === 'milestone' && achievement.threshold) {
    return MILESTONE_BADGE_IMAGES[achievement.threshold];
  }
  return LIST_BADGE_IMAGES[achievement.id];
}

// Get display name for achievement
function getAchievementName(achievement: { id: string; threshold?: number; type: string }): string {
  if (achievement.type === 'milestone' && achievement.threshold) {
    return CLUB_NAMES[achievement.threshold] || `${achievement.threshold} Club`;
  }
  return REGION_NAMES[achievement.id] || achievement.id;
}

// Get ghost badge info
function getGhostBadgeImage(nudge: BadgeNudge): string | undefined {
  if (nudge.type === 'global') {
    return MILESTONE_BADGE_IMAGES[nudge.nextThreshold];
  }
  const regionMap: Record<string, string> = {
    'GBI': 'list_gb_ireland',
    'EU': 'list_europe',
    'USA': 'list_usa',
    'WORLD': 'list_worldwide',
  };
  return LIST_BADGE_IMAGES[regionMap[nudge.regionId]];
}

// Get ghost badge name
function getGhostBadgeName(nudge: BadgeNudge): string {
  if (nudge.type === 'global') {
    return CLUB_NAMES[nudge.nextThreshold] || `${nudge.nextThreshold} Club`;
  }
  const regionMap: Record<string, string> = {
    'GBI': 'list_gb_ireland',
    'EU': 'list_europe',
    'USA': 'list_usa',
    'WORLD': 'list_worldwide',
  };
  return REGION_NAMES[regionMap[nudge.regionId]] || 'Next Badge';
}

/**
 * ProfileAchievementsRail - Trophy Case style horizontal carousel
 * Matches Quest page Trophy Case design with large badges and club names
 * Order: [Locked next badge] → [Earned badges oldest to newest]
 */
const ProfileAchievementsRail: React.FC<ProfileAchievementsRailProps> = ({
  userId,
  username,
  className,
}) => {
  const navigate = useNavigate();
  const { data: achievements, isLoading } = useProfileAchievements(userId);
  const { data: progressData } = useTop100ProgressForUser(userId);

  // Calculate nudge for ghost card (next badge to unlock)
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

  // Sort earned achievements by oldest first (so newest appears on right)
  const sortedEarnedAchievements = useMemo(() => {
    return [...(achievements || [])].sort((a, b) => {
      const aDate = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const bDate = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      // Oldest first (so most recent ends up on the right)
      return aDate - bDate;
    });
  }, [achievements]);

  const handleViewAll = () => {
    navigate('/achievements');
  };

  // Show nothing if loading or no achievements and no next badge
  if (isLoading || (sortedEarnedAchievements.length === 0 && !nudge)) return null;

  return (
    <section
      className={cn("px-4", className)}
      aria-label="Achievements"
    >
      {/* Title row */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Achievements
        </h2>
        <button
          type="button"
          onClick={handleViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Horizontal swipeable carousel - Trophy Case style */}
      <div 
        className="flex gap-5 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] scrollbar-hide -mx-4 px-4 snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* First position: Next badge to unlock (locked/greyed) */}
        {nudge && (
          <button
            type="button"
            onClick={handleViewAll}
            className="shrink-0 flex flex-col items-center group snap-start"
            style={{ width: 100 }}
          >
            {/* Large badge - locked state: 40% opacity + 60% grayscale */}
            <div className="relative mb-2">
              {getGhostBadgeImage(nudge) ? (
                <img
                  src={getGhostBadgeImage(nudge)}
                  alt={getGhostBadgeName(nudge)}
                  className="w-[88px] h-[110px] object-contain opacity-40 grayscale-[60%] transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="w-[88px] h-[110px] rounded-xl bg-slate-100 flex items-center justify-center opacity-40">
                  <span className="text-3xl font-bold text-slate-300">
                    {nudge.type === 'global' ? nudge.nextThreshold : '?'}
                  </span>
                </div>
              )}
              {/* Padlock icon - bottom right corner with slight overlap */}
              <div className="absolute bottom-2 right-0 w-5 h-5 rounded-full bg-slate-200/90 flex items-center justify-center shadow-sm ring-1 ring-white/50">
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
            </div>
            {/* Club name - muted for locked */}
            <span className="text-xs font-semibold text-[#94a3b8] text-center leading-tight max-w-[100px]">
              {getGhostBadgeName(nudge)}
            </span>
          </button>
        )}

        {/* Earned badges: oldest to newest (newest on right) */}
        {sortedEarnedAchievements.map((ach) => {
          const badgeImage = getBadgeImage(ach);
          const achievementName = getAchievementName(ach);
          
          return (
            <button
              key={ach.id}
              type="button"
              onClick={handleViewAll}
              className="shrink-0 flex flex-col items-center group snap-start"
              style={{ width: 100 }}
            >
              {/* Large badge image - 88px matching Trophy Case */}
              <div className="relative mb-2">
                {badgeImage ? (
                  <img
                    src={badgeImage}
                    alt={achievementName}
                    className="w-[88px] h-[110px] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-[88px] h-[110px] rounded-xl bg-slate-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-400">
                      {ach.threshold || '?'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Club name below - full color for earned */}
              <span className="text-xs font-semibold text-[#1e293b] text-center leading-tight max-w-[100px]">
                {achievementName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileAchievementsRail;
