import { useGamRpc } from './_useGamRpc';
import type { StreakRow } from '@/lib/gam/types';

export function useMyStreaks(enabled = true) {
  return useGamRpc<StreakRow[]>(
    'get_my_streaks',
    {},
    { enabled, staleTime: 30_000 },
  );
}
