import { useGamRpc } from './_useGamRpc';
import type { StreakRow } from '@/lib/gam/types';

/**
 * Friend-view counterpart to `useMyStreaks`. Calls `get_user_streaks(p_user_id)`,
 * a SECURITY DEFINER RPC that mirrors `get_my_streaks` for an explicit owner.
 *
 * Trust gating: enforced at the route/page level (HandicapPage only mounts
 * friend-view surfaces when viewer is friends with the owner). This hook does
 * not re-check the social graph.
 */
export function useUserStreaks(userId: string | null | undefined, enabled = true) {
  return useGamRpc<StreakRow[]>(
    'get_user_streaks',
    { p_user_id: userId ?? '' },
    { enabled: enabled && !!userId, staleTime: 30_000 },
  );
}
