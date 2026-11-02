/** Server owns tier ordering, visibility and the permitted oldest-first day post ids.
 * Viewer-scoped keys keep cached member rows out of another member's session.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExplorePerson {
  tier: 'you' | 'following' | 'creator' | 'member' | 'quiet';
  actor_id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_creator: boolean;
  has_new: boolean;
  new_post_ids: string[];
  latest_at: string | null;
}

export function useExplorePeopleRow(limit: number, userId: string | undefined) {
  return useQuery({
    queryKey: ['explore-people-row', userId, limit],
    enabled: !!userId,
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_explore_people_row' as never, { p_limit: limit } as never);
      if (error) throw error;
      return (data ?? []) as unknown as ExplorePerson[];
    },
  });
}