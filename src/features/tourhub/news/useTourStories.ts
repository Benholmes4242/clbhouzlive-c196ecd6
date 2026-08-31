/**
 * The Wire — data access for tour stories.
 *
 * A DRAFT IS INVISIBLE: every query filters `published_at` to non-null AND in
 * the past, mirroring the RLS policy so a draft is never rendered, counted or
 * routable even if the policy were relaxed.
 *
 * Stories are read-only from the client. Publishing happens server-side.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseStoryBlocks, type StoryBlock } from './blocks';

export interface TourStory {
  id: string;
  slug: string;
  kicker: string | null;
  headline: string;
  standfirst: string | null;
  body_blocks: StoryBlock[];
  image_url: string | null;
  image_credit: string | null;
  tour_slug: string | null;
  tournament_id: string | null;
  published_at: string | null;
}

const COLS =
  'id, slug, kicker, headline, standfirst, body_blocks, image_url, image_credit, tour_slug, tournament_id, published_at';

/** Rows arrive with body_blocks as raw jsonb; narrow it once, here. */
function toStory(row: any): TourStory {
  return { ...row, body_blocks: parseStoryBlocks(row?.body_blocks) } as TourStory;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * The list. Newest first, always.
 *
 * The tour lens is applied CLIENT-SIDE on purpose: a story with a null
 * tour_slug is cross-tour and must appear on every tour, and filtering in SQL
 * would make the "all tours" and "null slug" cases two different queries over
 * the same 30 rows.
 */
export function useTourStories(tourSlug: string | null) {
  const q = useQuery({
    queryKey: ['tour-stories', 'list'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TourStory[]> => {
      const { data, error } = await supabase
        .from('tour_stories')
        .select(COLS)
        .not('published_at', 'is', null)
        .lte('published_at', nowIso())
        .order('published_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []).map(toStory);
    },
  });

  const all = q.data ?? [];
  const stories =
    !tourSlug || tourSlug === 'all'
      ? all
      : all.filter((s) => s.tour_slug == null || s.tour_slug === tourSlug);

  return { ...q, stories, latestAt: stories[0]?.published_at ?? null };
}

/** One story by its public slug. Drafts resolve as not found. */
export function useTourStory(slug: string | undefined) {
  return useQuery({
    queryKey: ['tour-stories', 'story', slug],
    enabled: !!slug,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TourStory | null> => {
      const { data, error } = await supabase
        .from('tour_stories')
        .select(COLS)
        .eq('slug', slug as string)
        .not('published_at', 'is', null)
        .lte('published_at', nowIso())
        .maybeSingle();
      if (error) throw error;
      return data ? toStory(data) : null;
    },
  });
}

/** MORE FROM THE WIRE — three rows, newest first, excluding the current story. */
export function useMoreFromTheWire(excludeId: string | undefined) {
  return useQuery({
    queryKey: ['tour-stories', 'more', excludeId],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TourStory[]> => {
      let query = supabase
        .from('tour_stories')
        .select(COLS)
        .not('published_at', 'is', null)
        .lte('published_at', nowIso())
        .order('published_at', { ascending: false })
        .limit(4);
      if (excludeId) query = query.neq('id', excludeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(toStory).slice(0, 3);
    },
  });
}

export interface StoryTournamentCard {
  id: string;
  name: string;
  status: string | null;
  currentRound: number | null;
  isLive: boolean;
  leaderName: string | null;
  leaderCount: number;
  leaderToPar: number | null;
}

/**
 * The live tournament card's data. Tournament rows and leaderboards are public
 * tour data, so this resolves for a signed-out guest exactly as it does for a
 * member — the card does not degrade.
 */
export function useStoryTournament(tournamentId: string | null | undefined) {
  return useQuery({
    queryKey: ['tour-stories', 'tournament', tournamentId],
    enabled: !!tournamentId,
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
    queryFn: async (): Promise<StoryTournamentCard | null> => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('id, name, status, current_round')
        .eq('id', tournamentId as string)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: lb } = await supabase
        .from('sr_leaderboards')
        .select('score, player:sr_players!sr_leaderboards_player_id_fkey(full_name, first_name, last_name)')
        .eq('tournament_id', tournamentId as string)
        .order('score', { ascending: true })
        .limit(12);

      let leaderName: string | null = null;
      let leaderToPar: number | null = null;
      let leaderCount = 0;
      for (const r of (lb ?? []) as any[]) {
        if (r.score === null || r.score === undefined) continue;
        if (leaderToPar === null || r.score < leaderToPar) {
          leaderToPar = r.score;
          leaderName =
            r.player?.full_name ||
            [r.player?.first_name, r.player?.last_name].filter(Boolean).join(' ') ||
            null;
          leaderCount = 1;
        } else if (r.score === leaderToPar) {
          leaderCount += 1;
        }
      }

      return {
        id: data.id as string,
        name: (data.name as string) ?? '',
        status: (data.status as string) ?? null,
        currentRound: (data.current_round as number) ?? null,
        isLive: ((data.status as string) ?? '').toLowerCase() === 'inprogress',
        leaderName,
        leaderCount,
        leaderToPar,
      };
    },
  });
}
