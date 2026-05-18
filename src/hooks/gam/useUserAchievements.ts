import { useGamRpc } from './_useGamRpc';
import type { UserBadge } from '@/lib/gam/types';

/**
 * Returns the full badge catalogue with the user's earned status overlaid.
 * Works for self and friend views — RLS gates the data.
 */
export function useUserAchievements(userId: string | undefined) {
  return useGamRpc<UserBadge[]>(
    'get_user_achievements_for_viewer',
    userId ? { p_user_id: userId } : ({} as { p_user_id: string }),
    { enabled: Boolean(userId), staleTime: 60_000 },
  );
}
