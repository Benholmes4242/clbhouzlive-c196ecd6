import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { getNextBadgeNudge, type BadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import { PremiumCheckmark } from '@/components/quest/PremiumCheckmark';

// Import badge images
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandSlam400Image from '@/assets/achievements/grand-slam-400.png';
import globalBadgeImage from '@/assets/badges/global-badge.png';
import gbiBadgeImage from '@/assets/badges/gbi-badge.png';
import europeBadgeImage from '@/assets/badges/europe-badge.png';

interface ProfileAchievementsRailProps {
  userId: string;
  username: string;
  className?: string;
}

const MAX_VISIBLE = 12;

// Badge image mapping for milestones
const MILESTONE_BADGE_IMAGES: Record<number, string> = {
  5: rookieBadgeImage,
  10: fairwayBadgeImage,
  20: foundersBadgeImage,
  50: heritageBadgeImage,
  100: centuryBadgeImage,
  200: eliteBadgeImage,
  300: legendaryBadgeImage,
  400: grandSlam400Image,
};

// Badge image mapping for list completions
const LIST_BADGE_IMAGES: Record<string, string> = {
  'list_gb_ireland': gbiBadgeImage,
  'list_europe': europeBadgeImage,
  'list_usa': centuryBadgeImage,
  'list_worldwide': globalBadgeImage,
};

// Get badge image for achievement
function getBadgeImage(achievement: { id: string; threshold?: number; type: string }): string | undefined {
  if (achievement.type === 'milestone' && achievement.threshold) {
    return MILESTONE_BADGE_IMAGES[achievement.threshold];
  }
  return LIST_BADGE_IMAGES[achievement.id];
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

/**
 * ProfileAchievementsRail - Clean badge display without borders
 * Shows all unlocked milestone and list completion achievements
 * Badges sit directly on page background with PremiumCheckmark for earned
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
  const sortedAchievements = [...(achievements || [])].sort((a, b) => {
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
    >
      {/* Title row */}
      <div className="mb-3 flex items-center justify-between">
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

      {/* Horizontal scroll - badges directly on background, no cards */}
      <div className="flex gap-5 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] scrollbar-hide -mx-4 px-4">
        {visible.map((ach) => {
          const badgeImage = getBadgeImage(ach);
          return (
            <button
              key={ach.id}
              type="button"
              onClick={handleViewAll}
              className="shrink-0 flex flex-col items-center"
              style={{ width: 72 }}
            >
              {/* Badge with checkmark - no border, no card */}
              <div className="relative">
                {badgeImage ? (
                  <img
                    src={badgeImage}
                    alt={ach.shortLabel}
                    className="w-16 h-20 object-contain"
                  />
                ) : (
                  <div className="w-16 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-400">
                      {ach.threshold || '?'}
                    </span>
                  </div>
                )}
                {/* Premium checkmark for earned badges */}
                <PremiumCheckmark
                  size="sm"
                  className="absolute -bottom-1 -right-1"
                />
              </div>
              
              {/* Label - full text, centered, can wrap */}
              <span className="mt-2 text-xs text-slate-500 text-center leading-tight">
                {ach.shortLabel}
              </span>
            </button>
          );
        })}

        {/* Ghost card for next badge */}
        {showGhostCard && (
          <button
            type="button"
            onClick={handleViewAll}
            className="shrink-0 flex flex-col items-center"
            style={{ width: 72 }}
          >
            <div className="relative opacity-40">
              {getGhostBadgeImage(nudge) ? (
                <img
                  src={getGhostBadgeImage(nudge)}
                  alt="Next badge"
                  className="w-16 h-20 object-contain grayscale"
                />
              ) : (
                <div className="w-16 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-300">
                    {nudge.type === 'global' ? nudge.nextThreshold : '?'}
                  </span>
                </div>
              )}
            </div>
            <span className="mt-2 text-xs text-slate-400 text-center leading-tight">
              {nudge.remaining} away
            </span>
          </button>
        )}
      </div>
    </section>
  );
};

export default ProfileAchievementsRail;
