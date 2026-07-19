/**
 * useSearchEmptyStateV2 — one RPC call powering the SearchOverlayV2
 * default (no-query) state: in-action players, people-to-follow, popular
 * courses. Live-event headline freshness matters, so the cache expires
 * after 5 minutes; people/courses change slowly enough that window-focus
 * refetch is disabled.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EmptyStateEvent = {
  id: string;
  name: string;
  is_live: boolean;
  tour_slug?: string | null;
};

export type EmptyStatePlayer = {
  id: string;
  full_name: string;
  abbr_name: string | null;
  country: string | null;
  country_code: string | null;
  headshot_override: string | null;
  world_rank: number | null;
};

export type EmptyStateSuggestion = {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  reason_type: 'followed_by' | 'plays' | 'popular' | string;
  reason_detail: string | null;
  score: number;
};

export type EmptyStateCourse = {
  id: string;
  name: string;
  sub_country: string | null;
  country: string | null;
  avg_rating: number | null;
  rating_count: number | null;
};

export interface EmptyStatePayload {
  event?: EmptyStateEvent;
  players: EmptyStatePlayer[];
  suggested_people: EmptyStateSuggestion[];
  popular_courses: EmptyStateCourse[];
}

const EMPTY: EmptyStatePayload = {
  players: [],
  suggested_people: [],
  popular_courses: [],
};

export function useSearchEmptyStateV2(enabled: boolean) {
  return useQuery({
    queryKey: ['search-empty-state-v2'],
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<EmptyStatePayload> => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
      ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
      const { data, error } = await rpc('search_empty_state_v2');
      if (error) throw error;
      const j = (data ?? {}) as Partial<EmptyStatePayload>;
      return {
        event: j.event,
        players: j.players ?? [],
        suggested_people: j.suggested_people ?? [],
        popular_courses: j.popular_courses ?? [],
      };
    },
    placeholderData: EMPTY,
  });
}
