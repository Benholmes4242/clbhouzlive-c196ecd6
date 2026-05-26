import { useGamRpc } from './_useGamRpc';

/**
 * Row returned by `get_my_pod_standings`. The RPC returns the FULL pod (30
 * members) sorted by `live_rank ASC`, with the caller's row flagged via
 * `is_self`.
 */
export interface PodStandingRow {
  user_id: string;
  user_photo_url: string | null;
  bracket: string;            // 'platinum' | 'gold' | 'silver' | 'bronze' | ...
  pod_number: number;
  season: string;             // 'spring_2026' | etc
  season_end: string;         // ISO date
  live_rank: number;          // 1..30
  current_points: number;
  rounds_counted: number;
  eg_handicap_index: number;
  home_club: string | null;
  is_self: boolean;
  zone: string;               // 'promotion' | 'safe' | 'relegation'
}

export function useMyPodStandings() {
  return useGamRpc<PodStandingRow[]>(
    'get_my_pod_standings',
    {},
    { staleTime: 60_000 },
  );
}
