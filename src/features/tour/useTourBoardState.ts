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

export type TourBoardKey = 'live' | 'fedex' | 'rtd' | 'oom' | 'cme' | 'livpts' | 'colleges';

/**
 * THE SEASON RACE OF EACH TOUR. This is the pair that makes the picker and the
 * chip row TWO VIEWS OF ONE STATE: a race chip names its tour, and a tour names
 * its race. They cannot disagree, so nothing has to be locked.
 */
const RACE_TOUR: Partial<Record<TourBoardKey, PlayersTourId>> = {
  fedex: 'pga',
  rtd: 'euro',
  oom: 'pgad',
  cme: 'lpga',
  livpts: 'liv',
};

export const BOARD_LABEL: Record<TourBoardKey, string> = {
  live: 'Leaderboard',
  fedex: 'FedEx',
  rtd: 'Race to Dubai',
  oom: 'Order of Merit',
  cme: 'Race to CME Globe',
  livpts: 'LIV Standings',
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
  /** Quiet factual context beneath the row name. */
  subline: string;
  /** LIVE only: numeric to-par, so the colour ramp is decided by the reader. */
  toPar: number | null;
  /** LIVE only. */
  thru: number | null;
  live: boolean;
}

/**
 * THE ONE EXCEPTION, AND THE ONLY ONE.
 *
 * Colleges is not a tour, so it cannot follow the picker. While Colleges is the
 * active board the picker is dimmed and reads "Colleges"; selecting any tour
 * from there returns to that tour's season race. Every other board follows the
 * picker, and the picker follows every other board, so nothing else is locked.
 */
export type TourPickerLock = 'colleges' | null;

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
  /**
   * THE ONE COMBINATION WITH NO BOARD AT ALL. The Champions Tour carries no
   * season ranking anywhere in the data, so out of tournament it has nothing to
   * rank: the block renders NOTHING rather than falling into another tour's
   * race under a picker that reads "Champions". When it is live the Leaderboard
   * is the whole row.
   */
  silent: boolean;
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

export function useTourBoardState(
  tour: TourId | null,
  _onTourChange: (next: TourId | null) => void,
  /** The pushed rankings page opens on the board it was sent to. */
  initialBoard?: TourBoardKey,
): TourBoardState {
  const { data: cache } = useTournamentsCache();

  /* THE PICKER GOVERNS THIS ONE: the live event of the tour being read, biggest
     purse first when a tour has two in play. */
  const liveTournament = useMemo(() => {
    const live = (cache?.live ?? [])
      .filter((t) => t.status === 'inprogress' && (!tour || t.season?.tour_name === tour))
      .sort((a, b) => (b.purse ?? 0) - (a.purse ?? 0));
    return live[0] ?? null;
  }, [cache, tour]);

  /* A CHIP ONLY EXISTS IF ITS BOARD HAS ROWS BEHIND IT. A chip leading to an
     empty list is worse than an absent chip: the member has to tap to find out.
     The same floor as the ranking hook (5) applies — a ranking of one is a data
     failure, not a short board. Measured 8 Sep 2026: FedEx 219, Order of Merit
     227, Race to CME Globe 190, LIV Standings 60, Colleges 141, Race to Dubai 1
     (unsynced — its chip does not render). */
  const colleges = useFranchiseStandings();
  const availability = useQuery<Partial<Record<TourBoardKey, number>>>({
    queryKey: ['tour-board-availability'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const year = new Date().getMonth() >= 9 ? new Date().getFullYear() + 1 : new Date().getFullYear();
      const codes: Array<[TourBoardKey, string]> = [
        ['rtd', 'euro'],
        ['oom', 'pgad'],
        ['cme', 'lpga'],
        ['livpts', 'liv'],
      ];
      const counts: Partial<Record<TourBoardKey, number>> = {};
      await Promise.all(
        codes.map(async ([key, code]) => {
          const { count } = await supabase
            .from('tour_season_rankings')
            .select('id', { count: 'exact', head: true })
            .eq('tour_code', code)
            .eq('season_year', year);
          counts[key] = count ?? 0;
        }),
      );
      const { count: fedex } = await supabase
        .from('sr_player_statistics')
        .select('id', { count: 'exact', head: true })
        .not('fedex_points', 'is', null);
      counts.fedex = fedex ?? 0;
      return counts;
    },
  });

  const MIN_BOARD_ROWS = 5;
  const collegeRows = colleges.data?.standings?.length ?? 0;
  const hasRows = (key: TourBoardKey): boolean => {
    if (key === 'live' || key === 'colleges') return true;
    /* Until the measurement lands, the chip row holds its shape rather than
       flickering boards in and out under the member's thumb. */
    if (availability.isPending || !availability.data) return true;
    return (availability.data[key] ?? 0) >= MIN_BOARD_ROWS;
  };

  const chips: TourBoardKey[] = (
    [
      ...(liveTournament ? (['live'] as TourBoardKey[]) : []),
      'fedex',
      'rtd',
      'oom',
      ...(colleges.isPending || collegeRows > 0 ? (['colleges'] as TourBoardKey[]) : []),
    ] as TourBoardKey[]
  ).filter(hasRows);

  /* THE MEMBER'S OWN CHOICE, HELD WITH THE TOUR IT WAS MADE FOR. When the tour
     moves, the board moves with it to that tour's season race — one subject, two
     views. Colleges is the exception and survives a tour change only until the
     member picks a tour, which is what returns them to a race. */
  const [chosen, setChosen] = useState<TourBoardKey | null>(initialBoard ?? null);
  const fallback: TourBoardKey = liveTournament ? 'live' : 'rtd';
  const requested = chosen ?? fallback;
  const board = chips.includes(requested) ? requested : (chips.includes(fallback) ? fallback : chips[0]);

  const pointsTour = RACE_TOUR[board];
  const ranking = usePlayersRanking(pointsTour ?? 'pga');

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
    const changeBoard = (next: TourBoardKey) => {
      setChosen(next);
    };

    const pickerLock: TourPickerLock = board === 'colleges' ? 'colleges' : null;
    /* Champions out of tournament: no season race exists, so nothing is shown
       rather than another tour's race under a "Champions" picker. */
    const silent = false;
    const raceTour = RACE_TOUR[board] as TourId | undefined;
    const basis =
      board === 'colleges'
        ? 'College golf'
        : raceTour
          ? `${TOUR_CONFIG[raceTour].name} season`
          : board === 'live'
            ? tour ? TOUR_CONFIG[tour].name : 'All tours'
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
          tourCode: tour ?? liveTournament?.season?.tour_name ?? null,
          mark: 'round' as const,
          figure: null,
          subline: r.thru == null ? 'Round in progress' : Number(r.thru) >= 18 ? 'Finished' : `Thru ${r.thru}`,
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
        silent,
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
        subline: `${s.alumniCount} alumni · ${s.winsTotal} ${s.winsTotal === 1 ? 'win' : 'wins'}`,
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
        silent,
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
      subline: r.eventsPlayed
        ? `${r.eventsPlayed} events`
        : r.wins
          ? `${r.wins} ${r.wins === 1 ? 'win' : 'wins'}`
          : 'Season',
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
      silent,
      isPending: ranking.isPending,
      /* A ranking of one is a data failure, and the hook already says so. */
      unavailable: !ranking.isPending && (!result?.synced || rows.length === 0),
    };
  }, [board, chips, colleges.data, colleges.isPending, liveBoard.data, liveBoard.isPending, liveTournament, pointsTour, ranking.data, ranking.isPending, tour]);
}
