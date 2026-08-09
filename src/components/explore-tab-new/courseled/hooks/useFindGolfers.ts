/**
 * useFindGolfers (BRIEF_FIND_GOLFERS_SHEET §6) — ONE round trip behind the
 * Find golfers sheet.
 *
 * The search overlay's own RPC (`search_empty_state_v2`) could take the five
 * new fields additively, but it caps `suggested_people` at 5 and its consumer
 * renders every row it is handed — raising that cap IS a shape change for the
 * overlay. So the sheet gets a sibling function that reuses the same reason
 * ranking and adds the golf: handicap (gated server-side by
 * can_view_handicap), 18-hole rounds tracked, home club, and the three
 * relationship flags. No per-row client reads.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FindGolfersReason =
  | 'followed_by'
  | 'plays'
  | 'popular'
  | 'match'
  | (string & {});

export interface FindGolferRow {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  reason_type: FindGolfersReason;
  reason_detail: string | null;
  /** NULL when this viewer may not see it — the function decides, not us. */
  handicap_index: number | null;
  home_club: string | null;
  rounds_tracked: number;
  is_friend: boolean;
  /** A pending request THIS member sent. */
  friend_pending: boolean;
  /** A pending request the OTHER member sent — adding them accepts it. */
  friend_incoming: boolean;
  is_following: boolean;
}

export interface FindGolfersPayload {
  total_members: number;
  members: FindGolferRow[];
}

export const FIND_GOLFERS_KEY = ['courseled', 'find-golfers'] as const;

export function useFindGolfers(enabled: boolean, query: string) {
  const q = query.trim();

  return useQuery({
    queryKey: [...FIND_GOLFERS_KEY, q],
    enabled,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<FindGolfersPayload> => {
      const { data, error } = await (supabase.rpc('find_golfers_v1' as never, {
        p_query: q || null,
        p_limit: 30,
      } as never) as unknown as PromiseLike<{
        data: unknown;
        error: { message: string } | null;
      }>);
      if (error) throw error;
      const j = (data ?? {}) as Partial<FindGolfersPayload>;
      return {
        total_members: j.total_members ?? 0,
        members: (j.members ?? []).map((m) => ({
          ...m,
          rounds_tracked: Number(m.rounds_tracked ?? 0),
          handicap_index:
            m.handicap_index == null ? null : Number(m.handicap_index),
        })),
      };
    },
  });
}
