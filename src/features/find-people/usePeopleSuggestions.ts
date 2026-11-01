/**
 * WF1 — the Find people page's data sources.
 *
 * Reads public.get_people_suggestions and public.get_suggested_businesses
 * (WF1_PEOPLE_V1, run by Ben). These are DEDICATED rpcs: they already exclude
 * followed, blocked and dismissed people, and handicap_index arrives null
 * unless the viewer may see it — this hook never re-checks visibility.
 *
 * NOT get_suggested_golfers: that one serves the Activity "Golfers to follow"
 * block and returns handicaps WITHOUT a visibility check (noted in the WF1
 * report). The two surfaces keep separate reads so one cannot break the other.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { BusinessSuggestion, PersonSuggestion } from './findPeopleRules';

export function usePeopleSuggestions(limit = 60, enabled = true) {
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: ['people-suggestions', user?.id ?? null, limit],
    enabled: !!user?.id && enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_suggestions', { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as unknown as PersonSuggestion[];
    },
  });
}

export function useBusinessSuggestions(limit = 30, enabled = true) {
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: ['business-suggestions', user?.id ?? null, limit],
    enabled: !!user?.id && enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_suggested_businesses', { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as unknown as BusinessSuggestion[];
    },
  });
}
