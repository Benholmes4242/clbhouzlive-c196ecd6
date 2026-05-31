import { useGamRpc } from './_useGamRpc';

export interface TitleInReach {
  course_id: string;
  course_name: string;
  hero_image_url: string | null;
  category: string;
  user_rank: number;
  user_value: number;
  leader_value: number;
  gap: number;
  attained_at: string;
}

export function useTitlesInReach(
  userId: string | undefined,
  window: '90d' | 'all_time' = '90d',
) {
  return useGamRpc<TitleInReach[]>(
    'get_player_titles_in_reach',
    { p_user_id: userId, p_window: window, p_limit: 6 },
    { enabled: Boolean(userId), staleTime: 60_000 },
  );
}
