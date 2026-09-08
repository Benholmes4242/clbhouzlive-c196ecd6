/**
 * THE TOUR HERO STATE MACHINE (BRIEF_TOUR_REBUILD, block 0).
 *
 * Three states, decided in this order and never blended:
 *   LIVE           — a tournament is in progress right now.
 *   JUST FINISHED  — nothing live, and the most recent event ended recently.
 *   NOTHING LIVE   — neither: the next dated event on the calendar.
 *
 * The selection reads the SHARED tournaments cache (live / completed /
 * upcoming) so the hero costs no extra tournament query, and adds exactly one
 * companion query for the figures the state actually shows: the top three for
 * LIVE, the champion for JUST FINISHED. NOTHING LIVE needs no companion — the
 * defending champion is a column on the row.
 *
 * TRUE MINUS everywhere: scores are rendered from the numeric to-par, so the
 * sign is the real character and not a hyphen.
 */

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useTournamentsCache, type CachedTournament } from '@/hooks/useTournamentsCache';

/** How recently an event must have ended to still own the hero. */
export const JUST_FINISHED_DAYS = 3;

export type TourHeroKind = 'live' | 'finished' | 'upcoming' | 'empty';

export interface HeroPlayer {
  name: string;
  toPar: number | null;
  position: number | null;
}

export interface TourHeroState {
  kind: TourHeroKind;
  tournament: CachedTournament | null;
  /** LIVE only: the round in play and the leader's holes completed. */
  round: number | null;
  thru: number | null;
  /** LIVE: top three. FINISHED: the champion, alone. */
  players: HeroPlayer[];
  /** NOTHING LIVE only. */
  defendingChampion: string | null;
  isLoading: boolean;
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

/** Biggest purse wins when several events are live at once — the same rule the picker uses. */
function byPurse(a: CachedTournament, b: CachedTournament) {
  return (b.purse ?? 0) - (a.purse ?? 0);
}

export function useTourHeroState(): TourHeroState {
  const { data: cache, isLoading: cacheLoading } = useTournamentsCache();

  const live = (cache?.live ?? []).filter((t) => t.status === 'inprogress').sort(byPurse);
  const subjectLive = live[0] ?? null;

  const finished = subjectLive
    ? null
    : (cache?.completed ?? [])
        .filter((t) => {
          const d = daysSince(t.end_date);
          return d !== null && d <= JUST_FINISHED_DAYS;
        })
        .sort((a, b) => (b.end_date ?? '').localeCompare(a.end_date ?? ''))[0] ?? null;

  const upcoming =
    subjectLive || finished
      ? null
      : [...(cache?.upcoming ?? [])].sort((a, b) =>
          (a.start_date ?? '').localeCompare(b.start_date ?? ''),
        )[0] ?? null;

  const subject = subjectLive ?? finished ?? upcoming;
  const kind: TourHeroKind = subjectLive
    ? 'live'
    : finished
      ? 'finished'
      : upcoming
        ? 'upcoming'
        : 'empty';

  /* ONE companion query, and only for the states that need names on the
     photograph. LIVE refetches on a five-minute interval to match the rest of
     the live surfaces; a finished board never moves again. */
  const needsBoard = kind === 'live' || kind === 'finished';
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['tour-hero-board', kind, subject?.id ?? null],
    enabled: needsBoard && !!subject?.id,
    staleTime: kind === 'live' ? 60_000 : 10 * 60_000,
    refetchInterval: kind === 'live' ? 5 * 60_000 : false,
    queryFn: async (): Promise<{ players: HeroPlayer[]; thru: number | null }> => {
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          'position, score, thru, player:sr_players!sr_leaderboards_player_id_fkey(full_name, first_name, last_name)',
        )
        .eq('tournament_id', subject!.id)
        .not('position', 'is', null)
        .order('position', { ascending: true })
        .limit(kind === 'live' ? 6 : 2);

      if (error) throw error;

      const rows = (data ?? []) as any[];
      const players: HeroPlayer[] = rows
        .map((r) => ({
          name:
            r.player?.full_name ||
            [r.player?.first_name, r.player?.last_name].filter(Boolean).join(' ') ||
            '',
          toPar: r.score ?? null,
          position: r.position ?? null,
        }))
        .filter((p) => p.name);

      return {
        players: players.slice(0, kind === 'live' ? 3 : 1),
        thru: rows[0]?.thru ?? null,
      };
    },
  });

  return {
    kind,
    tournament: subject,
    round: kind === 'live' ? subject?.current_round ?? null : null,
    thru: kind === 'live' ? board?.thru ?? null : null,
    players: board?.players ?? [],
    defendingChampion: kind === 'upcoming' ? subject?.defending_champion ?? null : null,
    isLoading: cacheLoading || (needsBoard && boardLoading),
  };
}
