/** Tour News page reads (BRIEF_TOUR_NEWS_PAGE §10): one sr_tournaments read
 * for the By-event chip names, one sr_leaderboards read for the lead's event
 * card, and the search read — which exists only while searching. Story chips
 * and followed names keep their shared overview reads (useOverviewNewsData). */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BoardEntry } from '../leaderboard/BoardTable';
import { STORY_COLS, toStory, type TourStory } from './useTourStories';
import { isRetiredTour } from '../constants/tourMap';

/** Real tournament names for the By-event chips. One read for every chip id. */
export function useNewsEventNames(ids: string[]) {
  const sorted = [...ids].sort();
  return useQuery({
    queryKey: ['tour-news-event-names', sorted],
    enabled: sorted.length > 0,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('sr_tournaments').select('id,name').in('id', sorted);
      if (error) throw error;
      return new Map((data ?? []).map((row) => [row.id as string, row.name as string]));
    },
  });
}

/** The lead event's board — position-ordered, for the event card's states. */
export function useNewsEventBoard(tournamentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['tour-news-event-board', tournamentId],
    enabled: enabled && !!tournamentId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select('id,tournament_id,position,position_tied,score,today,today_round,thru,status,round_1,round_2,round_3,round_4,player:sr_players!sr_leaderboards_player_id_fkey(id,full_name,last_name)')
        .eq('tournament_id', tournamentId as string)
        .order('position', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as BoardEntry[];
    },
  });
}

export const NEWS_SEARCH_LIMIT = 50;
export const NEWS_SEARCH_DEBOUNCE_MS = 250;
export const NEWS_SEARCH_MIN_CHARS = 2;

/** Server-side search across EVERY published story in the lens: headline,
 * standfirst or kicker ilike the query, newest first. Runs from the second
 * character, 250ms after the last keystroke. */
export function useNewsSearch(query: string, tourLens: string | null) {
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), NEWS_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  const active = debounced.length >= NEWS_SEARCH_MIN_CHARS;
  const q = useQuery({
    queryKey: ['tour-news-search', debounced],
    enabled: active,
    staleTime: 60_000,
    queryFn: async (): Promise<TourStory[]> => {
      const pattern = `%${debounced.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      const { data, error } = await supabase
        .from('tour_stories')
        .select(STORY_COLS)
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .or(`headline.ilike.${pattern},standfirst.ilike.${pattern},kicker.ilike.${pattern}`)
        .order('published_at', { ascending: false })
        .limit(NEWS_SEARCH_LIMIT);
      if (error) throw error;
      return (data ?? []).map(toStory);
    },
  });
  // The lens stays client-side, exactly as useTourStories applies it.
  const results = (q.data ?? []).filter(
    (s) => !isRetiredTour(s.tour_slug) && (!tourLens || tourLens === 'all' || s.tour_slug == null || s.tour_slug === tourLens),
  );
  return { debounced, active, results, isLoading: active && q.isLoading, settled: active && q.isSuccess };
}
