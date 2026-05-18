import { useMemo } from 'react';
import { useUserAchievements } from './useUserAchievements';
import type { RecentUnlock, UserBadge } from '@/lib/gam/types';

const RECENT_DAYS = 30;
const MAX_UNLOCKS = 6;

export function useRecentUnlocks(userId: string | undefined) {
  const achievementsQuery = useUserAchievements(userId);

  const unlocks: RecentUnlock[] = useMemo(() => {
    if (!achievementsQuery.data) return [];

    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

    const recentBadges: RecentUnlock[] = achievementsQuery.data
      .filter((b: UserBadge) => b.is_earned && b.earned_at && new Date(b.earned_at).getTime() > cutoff)
      .map((b: UserBadge): RecentUnlock => ({
        kind: 'badge',
        occurred_at: b.earned_at!,
        icon: b.icon_name,
        title: b.title,
        description: b.description,
        rarity: b.rarity,
        badge: b,
      }));

    return recentBadges
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, MAX_UNLOCKS);
  }, [achievementsQuery.data]);

  return {
    ...achievementsQuery,
    data: unlocks,
  };
}
