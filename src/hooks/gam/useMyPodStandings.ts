import { useGamRpc } from './_useGamRpc';
import type { PodStanding } from '@/lib/gam/types';

/**
 * Returns the caller's pod, sorted by live_rank. Refetched every 30s
 * to capture rank shifts as evaluator runs.
 */
export function useMyPodStandings(enabled = true) {
  return useGamRpc<PodStanding[]>(
    'get_my_pod_standings',
    {},
    { enabled, staleTime: 15_000, refetchInterval: 30_000 },
  );
}
