import { useMemo } from 'react';
import { useUserAchievements } from './useUserAchievements';
import type { RecentUnlock, UserBadge } from '@/lib/gam/types';

const RECENT_DAYS = 30;
const SEEN_GRACE_DAYS = 3;
const MAX_UNLOCKS = 6;

export function useRecentUnlocks(userId: string | undefined) {
  const achievementsQuery = useUserAchievements(userId);

  const { unlocks, unseenShownIds } = useMemo(() => {
    if (!achievementsQuery.data) return { unlocks: [] as RecentUnlock[], unseenShownIds: [] as string[] };

    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    const seenCutoff = Date.now() - SEEN_GRACE_DAYS * 24 * 60 * 60 * 1000;

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

    const visible = recentBadges.filter((u) => {
      const fs = u.badge?.first_seen_at ?? null;
      if (!fs) return true;
      return new Date(fs).getTime() > seenCutoff;
    });

    const sorted = visible
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, MAX_UNLOCKS);

    const ids = sorted
      .filter((u) => !u.badge?.first_seen_at)
      .map((u) => u.badge?.badge_id)
      .filter((id): id is string => Boolean(id));

    return { unlocks: sorted, unseenShownIds: ids };
  }, [achievementsQuery.data]);

  return {
    ...achievementsQuery,
    data: unlocks,
    unseenShownIds,
  };
}
