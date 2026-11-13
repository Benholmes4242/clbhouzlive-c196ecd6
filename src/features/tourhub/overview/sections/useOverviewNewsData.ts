import { overviewQueryReady } from '../../components/overview-v3/overviewShells';
/** Overview News observes the hero's existing tournaments-cache without a
 * query function or tournament read. A single filtered board request covers
 * every shown live story; names for non-live followed players are batched.
 * Refresh cadence matches the overview cache (60s). */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TournamentsCache } from '@/hooks/useTournamentsCache';
import { useTourPlayerFollows } from '../../leaderboard/useTourPlayerFollows';
import type { TourStory } from '../../news/useTourStories';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { deriveHeroState, isInPlayState } from '../../components/overview-v3/HybridHero.utils';
import type { HeroTournament } from '../../hooks/useHeroCarouselData';
import { storyPlayerIds, newsPlayers, type NewsPresentation } from './overviewNewsRules';

export async function readNewsBoards(tournamentIds: string[], playerIds: string[]) {
  if (!tournamentIds.length || !playerIds.length) return [];
  const { data, error } = await supabase.from('sr_leaderboards')
    .select('id,tournament_id,position,position_tied,score,today,today_round,thru,status,round_1,round_2,round_3,round_4,player:sr_players!sr_leaderboards_player_id_fkey(id,full_name,last_name)')
    .in('tournament_id', tournamentIds).in('player_id', playerIds).limit(1000);
  if (error) throw error;
  return data ?? [];
}
export function liveNewsRounds(cache: TournamentsCache | undefined): Map<string, number> {
  const rounds = new Map<string, number>();
  for (const event of cache?.live ?? []) {
    const state = deriveHeroState({ status: event.status, startDate: event.start_date, endDate: event.end_date, currentRound: event.current_round } as HeroTournament);
    if (isInPlayState(state)) rounds.set(event.id, state.round);
  }
  return rounds;
}
export function useOverviewNewsData(stories: TourStory[]) {
  const cache = useQuery<TournamentsCache>({ queryKey: ['tournaments-cache'], enabled: false });
  const { ids: follows } = useTourPlayerFollows(stories.length > 0);
  const rounds = liveNewsRounds(cache.data);
  const liveStories = stories.filter(story => story.tournament_id && rounds.has(story.tournament_id));
  const tournamentIds = [...new Set(liveStories.flatMap(story => story.tournament_id ? [story.tournament_id] : []))].sort();
  const playerIds = [...new Set(liveStories.flatMap(storyPlayerIds))].sort();
  const boards = useQuery({ queryKey: ['overview-news-boards', tournamentIds, playerIds], enabled: tournamentIds.length > 0 && playerIds.length > 0,
    queryFn: () => readNewsBoards(tournamentIds, playerIds), staleTime: 30_000, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const followed = [...new Set(stories.flatMap(storyPlayerIds))].filter(id => follows.has(id)).sort();
  const names = useQuery({ queryKey: ['overview-news-player-names', followed], enabled: followed.length > 0, staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('sr_players').select('id,full_name,last_name').in('id', followed);
      if (error) throw error;
      return data ?? [];
    } });
  const namesById = new Map((names.isError ? [] : names.data ?? []).map(player => [player.id, player.last_name || player.full_name]));
  const result = new Map<string, NewsPresentation>();
  for (const story of stories) {
    const round = rounds.get(story.tournament_id ?? '') ?? null;
    const board: BoardEntry[] = (boards.isError ? [] : boards.data ?? []).filter(entry => entry.tournament_id === story.tournament_id);
    result.set(story.id, { isNew: false, liveRound: round, players: newsPlayers(story, follows, namesById, board, round), followedPlayer: newsPlayers(story, follows, namesById, board, null)[0] });
  }
  return Object.assign(result, { ready: overviewQueryReady(boards, tournamentIds.length > 0 && playerIds.length > 0) && overviewQueryReady(names, followed.length > 0) });
}