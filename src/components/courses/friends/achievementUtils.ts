import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

export interface FriendAchievement {
  icon: string;
  label: string;
  gradient: string;
}

export const calculateFriendAchievements = (
  friendId: string,
  allRecent: FriendCourseHit[]
): FriendAchievement[] => {
  const friendRounds = allRecent.filter(hit => hit.friend_id === friendId);
  const achievements: FriendAchievement[] = [];

  // Top 100 courses count
  const top100Count = friendRounds.filter(hit => {
    const ranks = extractRanksFromMemberships(hit.top100_memberships, hit.course_country);
    return ranks.isTop100;
  }).length;
  if (top100Count >= 5) {
    achievements.push({
      icon: '🏆',
      label: `Top 100 streak · ${top100Count} courses`,
      gradient: 'bg-gradient-to-r from-yellow-50 to-amber-50'
    });
  }

  // Marathon golfer
  const roundsCount = friendRounds.length;
  if (roundsCount >= 4) {
    achievements.push({
      icon: '🔥',
      label: `Marathon golfer · ${roundsCount} rounds`,
      gradient: 'bg-gradient-to-r from-orange-50 to-red-50'
    });
  }

  // Explorer (unique regions)
  const regions = new Set(
    friendRounds.map(hit => `${hit.course_country}-${hit.course_sub_country || 'none'}`)
  );
  if (regions.size >= 3) {
    achievements.push({
      icon: '🌍',
      label: `Explorer · ${regions.size} regions`,
      gradient: 'bg-gradient-to-r from-blue-50 to-cyan-50'
    });
  }

  return achievements.slice(0, 2); // Max 2 achievements
};
