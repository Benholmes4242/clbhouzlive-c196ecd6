import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useTourLivePeek — ONE read of public.sr_leaderboards for the live tournaments
 * currently visible on Discover (BRIEF_DISCOVER_LIVE_TOUR, section 5).
 *
 * The tourhub-leaderboard edge function is an on-demand upstream proxy; Discover
 * deliberately does NOT call it. pg_cron job 54 (`tournament-live-sync`) already
 * writes sr_leaderboards every minute, so the page costs one Postgres read.
 *
 * FRESHNESS FIELD: sr_leaderboards.updated_at — the leaderboard row's own sync
 * stamp. The newest updated_at across a tournament's rows is that card's
 * freshness; older than 10 minutes and the card drops LIVE for LATEST.
 *
 * The query is only ENABLED when something is live, so nothing polls on a timer
 * during an off-week.
 */

/** One POSITION on the board, ties included. Places skip by tie size. */
export interface PeekPosition {
  /** Derived place: 1, then 1 + everyone above, so a six-way T2 is followed by 8. */
  place: number;
  tied: boolean;
  /** Names held by this position, alphabetical, capped at NAMES_PER_POSITION. */
  names: string[];
  /** How many further names the position holds beyond the ones carried. */
  extra: number;
  score: number | null;
}

export interface LivePeek {
  leaderName: string;
  /** Number of players tied with the leader beyond the named one. */
  leaderTiedExtra: number;
  leaderScore: number | null;
  /** Round to display, e.g. 2 for "R2". */
  round: number | null;
  thru: number | null;
  chasingName: string | null;
  chasingScore: number | null;
  /** Newest sr_leaderboards.updated_at across this tournament's rows. */
  updatedAt: string | null;
  /** The top three POSITIONS (not players), derived from the same rows. */
  positions: PeekPosition[];
}

const STALE_MS = 10 * 60 * 1000;

/**
 * NAMES CARRIED PER POSITION (BRIEF_ON_TOUR_GLASS_TILE_AND_TICKER §0a).
 *
 * The rows are already fetched; the cap is applied in the derivation below, so
 * raising it costs NO new query. It is RAISED, not removed: a position could in
 * principle hold dozens of players and a ticker over forty names never returns
 * to the first one within a member's attention. `extra` still carries anything
 * beyond this, so a row can still end "+12".
 */
export const NAMES_PER_POSITION = 8;

interface Row {
  tournament_id: string;
  position: number | null;
  score: number | null;
  thru: number | null;
  today_round: number | null;
  updated_at: string | null;
  player: { full_name: string | null } | null;
}

export function useTourLivePeek(tournamentIds: string[]) {
  const ids = Array.from(new Set(tournamentIds.filter(Boolean))).sort();

  return useQuery({
    queryKey: ['courseled', 'tour-live-peek', ids.join('|')],
    queryFn: async (): Promise<Map<string, LivePeek>> => {
      const out = new Map<string, LivePeek>();
      if (ids.length === 0) return out;

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          'tournament_id, position, score, thru, today_round, updated_at, player:sr_players(full_name)',
        )
        .in('tournament_id', ids)
        .lte('position', 12)
        .order('position', { ascending: true });
      if (error) throw error;

      const byTournament = new Map<string, Row[]>();
      for (const row of ((data ?? []) as unknown) as Row[]) {
        const list = byTournament.get(row.tournament_id) ?? [];
        list.push(row);
        byTournament.set(row.tournament_id, list);
      }

      for (const [id, rows] of byTournament) {
        const named = rows.filter((r) => r.player?.full_name && r.position != null);
        if (named.length === 0) continue;

        const top = Math.min(...named.map((r) => r.position as number));
        const leaders = named
          .filter((r) => r.position === top)
          .sort((a, b) =>
            String(a.player?.full_name).localeCompare(String(b.player?.full_name)),
          );
        const leader = leaders[0];

        // Second place is the next distinct position, not the next row.
        const chaseGroup = named
          .filter((r) => (r.position as number) > top)
          .sort((a, b) => (a.position as number) - (b.position as number));
        const chasePos = chaseGroup[0]?.position ?? null;
        const chasing =
          chasePos == null
            ? null
            : chaseGroup
                .filter((r) => r.position === chasePos)
                .sort((a, b) =>
                  String(a.player?.full_name).localeCompare(String(b.player?.full_name)),
                )[0];

        const stamps = rows
          .map((r) => r.updated_at)
          .filter((v): v is string => !!v)
          .sort();

        // TOP THREE POSITIONS, from the rows already fetched. Places are
        // DERIVED by cumulative count rather than trusting the feed's numbering,
        // so six tied for second is followed by EIGHTH, never third.
        const groups = new Map<number, Row[]>();
        for (const r of named) {
          const key = r.position as number;
          const list = groups.get(key) ?? [];
          list.push(r);
          groups.set(key, list);
        }
        const ordered = [...groups.entries()].sort((a, b) => a[0] - b[0]);
        const positions: PeekPosition[] = [];
        let above = 0;
        for (const [, rowsAt] of ordered) {
          if (positions.length < 3) {
            const names = rowsAt
              .map((r) => String(r.player?.full_name ?? ''))
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b));
            positions.push({
              place: above + 1,
              tied: names.length > 1,
              names: names.slice(0, NAMES_PER_POSITION),
              extra: Math.max(0, names.length - NAMES_PER_POSITION),
              score: rowsAt[0].score ?? null,
            });
          }
          above += rowsAt.length;
          if (positions.length >= 3) break;
        }

        out.set(id, {
          leaderName: String(leader.player?.full_name ?? ''),
          leaderTiedExtra: Math.max(0, leaders.length - 1),
          leaderScore: leader.score ?? null,
          round: leader.today_round ?? null,
          thru: leader.thru ?? null,
          chasingName: chasing?.player?.full_name ?? null,
          chasingScore: chasing?.score ?? null,
          updatedAt: stamps.length > 0 ? stamps[stamps.length - 1] : null,
          positions,
        });
      }

      return out;
    },
    enabled: ids.length > 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** True when a card may still claim LIVE; false drops it to a neutral LATEST. */
export function isPeekFresh(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return false;
  const t = new Date(updatedAt).getTime();
  return Number.isFinite(t) && Date.now() - t <= STALE_MS;
}
