import { useGamRpc } from './_useGamRpc';
import type { UserLegendStatus } from '@/lib/gam/types';

export function useUserLegendStatus(userId: string | undefined) {
  return useGamRpc<UserLegendStatus[]>(
    'get_user_legend_status',
    userId ? { p_user_id: userId } : ({} as { p_user_id: string }),
    { enabled: Boolean(userId), staleTime: 60_000 },
  );
}
