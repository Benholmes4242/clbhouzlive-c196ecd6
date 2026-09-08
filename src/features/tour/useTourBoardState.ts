/**
 * BLOCK 1 STATE — THE TOUR BOARDS (BRIEF_TOUR_REBUILD).
 *
 * FIVE CHIPS DURING A TOURNAMENT, FOUR OUT OF ONE. The live Leaderboard chip is
 * ABSENT when nothing is in progress — not disabled, not greyed: a chip that
 * cannot be pressed states a board that does not exist.
 *
 * THE THREE POINTS BOARDS ARE FIXED TO THEIR TOURS. FedEx is the PGA Tour, Race
 * to Dubai is the DP World Tour, the Order of Merit is the Korn Ferry Tour. They
 * do NOT follow the tour picker, because a "Race to Dubai" reading of the PGA
 * Tour is not a thing that exists. The picker governs the live Leaderboard (and
 * Our Picks); it does not govern a named season race.
 *
 * COLLEGES sits on the same ranked row with a SQUARE school mark, where a player
 * board carries a round one. Same row, different mark by board.
 *
 * The data is the DEPLOYED data: usePlayersRanking for the points boards,
 * useFranchiseStandings for Colleges, sr_leaderboards for the live board. No new
 * RPC, no re-sorting of a ranked read.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useTournamentsCache, type CachedTournament } from '@/hooks/useTournamentsCache';
import { useFranchiseStandings } from '@/features/tourhub/college-v2/hub/data/useFranchiseStandings';
import {
  usePlayersRanking,
  type PlayersTourId,
} from '@/features/tourhub/players-v2/data/usePlayersRanking';
import { TOUR_CONFIG, type TourId } from '@/features/tourhub/hooks/useOverviewData';

export type TourBoardKey = 'live' | 'fedex' | 'rtd' | 'oom' | 'colleges';

/** Which tour each points board reads. Fixed by definition, not by the picker. */
const POINTS_TOUR: Partial<Record<TourBoardKey, PlayersTourId>> = {
  fedex: 'pga',
  rtd: 'euro',
  oom: 'pgad',
};

export const BOARD_LABEL: Record<TourBoardKey, string> = {
  live: 'Leaderboard',
  fedex: 'FedEx Cup',
  rtd: 'Race to Dubai',
  oom: 'Order of Merit',
  colleges: 'Colleges',
};

export interface TourBoardRow {
  id: string;
  pos: number;
  name: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  tourCode: string | null;
  /** Round mark for players, square mark for schools. */
  mark: 'round' | 'square';
  /** The one figure this board ranks on, already formatted. */
  figure: string | null;
  /** LIVE only: numeric to-par, so the colour ramp is decided by the reader. */
  toPar: number | null;
  /** LIVE only. */
  thru: number | null;
  live: boolean;
}

/**
 * WHAT THE PICKER MUST READ WHILE THIS BOARD IS ACTIVE.
 *
 * `null` means the picker is the member's own and governs as normal (live
 * Leaderboard, Our Picks). A TourId means the board is fixed to that tour by
 * definition and the picker is locked to it. 'colleges' means the board is not
 * a tour at all — the picker reads "Colleges" and is locked.
 */
export type TourPickerLock = TourId | 'colleges' | null;

export interface TourBoardState {
  board: TourBoardKey;
  chips: TourBoardKey[];
  changeBoard: (next: TourBoardKey) => void;
  /** Locked picker value for the active board, or null when the member's own applies. */
  pickerLock: TourPickerLock;
  /** The basis the count line states — "PGA Tour season", "College golf". */
  basis: string | null;
  /** The live tournament governing the Leaderboard chip, when there is one. */
  liveTournament: CachedTournament | null;
  rows: TourBoardRow[];
  total: number;
  /** The column heading for the figure — FEDEX PTS, SCORE, EARNINGS. */
  figureLabel: string | null;
  isPending: boolean;
  /** True when the board is genuinely unsynced rather than merely empty. */
  unavailable: boolean;
}

function fmtPoints(n: number | null): string | null {
  if (n == null) return null;
  return Math.round(n).toLocaleString();
}

function fmtEarnings(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export function useTourBoardState(tour: TourId, initialBoard: TourBoardKey = 'live'): TourBoardState {
  const { data: cache } = useTournamentsCache();

  /* THE PICKER GOVERNS THIS ONE: the live event of the tour being read, biggest
     purse first when a tour has two in play. */
  const liveTournament = useMemo(() => {
    const live = (cache?.live ?? [])
      .filter((t) => t.status === 'inprogress' && t.season?.tour_name === tour)
      .sort((a, b) => (b.purse ?? 0) - (a.purse ?? 0));
    return live[0] ?? null;
  }, [cache, tour]);

  const chips: TourBoardKey[] = liveTournament
    ? ['live', 'fedex', 'rtd', 'oom', 'colleges']
    : ['fedex', 'rtd', 'oom', 'colleges'];

  const [requested, setRequested] = useState<TourBoardKey>(initialBoard);
  /* A board that has left the row cannot stay selected — when the last
     tournament finishes mid-session the Leaderboard chip goes and the reader
     lands on the first board that still exists. */
  const board = chips.includes(requested) ? requested : chips[0];

  const pointsTour = POINTS_TOUR[board];
  const ranking = usePlayersRanking(pointsTour ?? 'pga');
  const colleges = useFranchiseStandings();

  const liveBoard = useQuery({
    queryKey: ['tour-board-live', liveTournament?.id ?? null],
    enabled: board === 'live' && !!liveTournament?.id,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          'player_id, position, score, thru, player:sr_players!sr_leaderboards_player_id_fkey(full_name, country, country_code, photo_url)',
        )
        .eq('tournament_id', liveTournament!.id)
        .not('position', 'is', null)
        .order('position', { ascending: true })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  return useMemo<TourBoardState>(() => {
    const changeBoard = (next: TourBoardKey) => setRequested(next);

    /* THE PICKER MUST NEVER CONTRADICT THE LIST. A fixed-tour board locks the
       picker to its own tour; Colleges locks it to "Colleges", which is not a
       tour at all; the live board and Our Picks leave the member's own alone. */
    const pickerLock: TourPickerLock =
      board === 'colleges' ? 'colleges' : ((POINTS_TOUR[board] as TourId | undefined) ?? null);
    const basis =
      board === 'colleges'
        ? 'College golf'
        : pickerLock
          ? `${TOUR_CONFIG[pickerLock as TourId].name} season`
          : board === 'live'
            ? TOUR_CONFIG[tour].name
            : null;


    if (board === 'live') {
      const rows: TourBoardRow[] = (liveBoard.data ?? []).map((r, i) => {
        const p = r.player ?? {};
        const score = r.score == null ? null : Number(r.score);
        return {
          id: `${r.player_id ?? i}`,
          pos: Number(r.position ?? i + 1),
          name: p.full_name ?? '—',
          country: p.country ?? null,
          countryCode: p.country_code ?? null,
          photoUrl: p.photo_url ?? null,
          tourCode: tour,
          mark: 'round' as const,
          figure: null,
          toPar: Number.isFinite(score as number) ? (score as number) : null,
          thru: r.thru == null ? null : Number(r.thru),
          live: true,
        };
      });
      return {
        board,
        chips,
        changeBoard,
        pickerLock,
        basis,
        liveTournament,
        rows,
        total: rows.length,
        figureLabel: 'SCORE',
        isPending: liveBoard.isPending,
        unavailable: !liveBoard.isPending && rows.length === 0,
      };
    }

    if (board === 'colleges') {
      const standings = colleges.data?.standings ?? [];
      const rows: TourBoardRow[] = standings.map((s) => ({
        id: s.normalizedName,
        pos: s.rank,
        name: s.shortName || s.collegeName,
        country: null,
        countryCode: null,
        photoUrl: s.logoUrl,
        tourCode: null,
        mark: 'square' as const,
        figure: fmtEarnings(s.earningsTotal),
        toPar: null,
        thru: null,
        live: false,
      }));
      return {
        board,
        chips,
        changeBoard,
        pickerLock,
        basis,
        liveTournament,
        rows,
        total: rows.length,
        figureLabel: 'EARNINGS',
        isPending: colleges.isPending,
        unavailable: !colleges.isPending && rows.length === 0,
      };
    }

    const result = ranking.data;
    const rows: TourBoardRow[] = (result?.rows ?? []).map((r) => ({
      id: r.playerId,
      pos: r.rank,
      name: r.name,
      country: r.country,
      countryCode: r.countryCode,
      photoUrl: r.photoUrl,
      tourCode: r.tourCode ?? pointsTour ?? null,
      mark: 'round' as const,
      figure: fmtPoints(r.stat == null ? null : Number(r.stat)),
      toPar: null,
      thru: null,
      live: false,
    }));
    return {
      board,
      chips,
      changeBoard,
      pickerLock,
      basis,
      liveTournament,
      rows,
      total: rows.length,
      figureLabel: result?.statLabel ?? null,
      isPending: ranking.isPending,
      /* A ranking of one is a data failure, and the hook already says so. */
      unavailable: !ranking.isPending && (!result?.synced || rows.length === 0),
    };
  }, [board, chips, colleges.data, colleges.isPending, liveBoard.data, liveBoard.isPending, liveTournament, pointsTour, ranking.data, ranking.isPending, tour]);
}
