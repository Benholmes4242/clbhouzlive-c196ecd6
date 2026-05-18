import { useGamRpc } from './_useGamRpc';
import type { RivalryCourseBreakdown } from '@/lib/gam/types';

export function useRivalryBreakdown(rivalUserId: string | undefined) {
  return useGamRpc<RivalryCourseBreakdown[]>(
    'get_rivalry_breakdown',
    rivalUserId ? { p_rival_user_id: rivalUserId } : ({} as { p_rival_user_id: string }),
    { enabled: Boolean(rivalUserId), staleTime: 30_000 },
  );
}
