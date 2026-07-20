/**
 * useThisWeekAlumni — leaderboard rows for alumni playing THIS WEEK.
 *
 * Filters sr_leaderboards by (a) player_id ∈ college alumni ids, and
 * (b) tournament with dates overlapping the current Sun–Sat week (or
 * currently in-progress). For pre-tee players (no thru + no score yet)
 * we also fetch the latest sr_tee_times row so the UI can show a tee
 * time in the right-hand lockup.
 *
 * Verified columns (types.ts):
 *   sr_leaderboards:  player_id, position, position_tied, score, thru,
 *                     status, money, today
 *   sr_tee_times:     tournament_id, round_number, tee_time
 *   sr_tee_time_players: player_id, tee_time_id
 *   sr_tournaments:   id, name, status, start_date, end_date
 *   sr_players:       id, first_name, last_name, full_name, photo_url,
 *                     tour_codes, college_normalized
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentWeek } from '@/features/tourhub/utils/getCurrentWeek';

export interface WeekAlumnusRow {
  playerId: string;
  fullName: string;
  photoUrl: string | null;
  tourCodes: string[] | null;
  tournamentId: string;
  tournamentName: string;
  tournamentStatus: string | null;
  isLive: boolean;
  position: number | null;
  positionTied: boolean | null;
  thru: number | null;
  score: number | null;
  today: number | null;
  status: string | null;
  money: number | null;
  teeTime: string | null;
}

export function useThisWeekAlumni(normalizedName: string | undefined) {
  return useQuery<WeekAlumnusRow[]>({
    queryKey: ['college-v2', 'this-week-alumni', normalizedName ?? 'none'],
    enabled: !!normalizedName,
    staleTime: 60_000,
    refetchInterval: 90_000,
    queryFn: async () => {
      if (!normalizedName) return [];

      interface AlumnusRow {
        id: string;
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
        photo_url: string | null;
        tour_codes: string[] | null;
      }

      // Alumni ids for this college.
      const { data: alumni, error: alumniErr } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, photo_url, tour_codes')
        .eq('college_normalized', normalizedName);
      if (alumniErr) throw alumniErr;
      if (!alumni?.length) return [];
      const alumniIds = alumni.map((a) => a.id);
      const alumniById = new Map<string, AlumnusRow>(
        (alumni as AlumnusRow[]).map((a) => [a.id, a]),
      );

      const { start, end } = getCurrentWeek();
      const startISO = start.toISOString().slice(0, 10);
      const endISO = end.toISOString().slice(0, 10);

      // sr_leaderboards joined with tournament, filtered on tournament dates.
      interface LbRow {
        player_id: string;
        position: number | null;
        position_tied: boolean | null;
        score: number | null;
        thru: number | null;
        money: number | null;
        today: number | null;
        status: string | null;
        tournament: {
          id: string;
          name: string | null;
          status: string | null;
          start_date: string | null;
          end_date: string | null;
        } | null;
      }
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          'player_id, position, position_tied, score, thru, money, today, status, ' +
          'tournament:sr_tournaments!inner(id, name, status, start_date, end_date)',
        )
        .in('player_id', alumniIds)
        .lte('tournament.start_date', endISO)
        .gte('tournament.end_date', startISO)
        .limit(500);
      // Converted from soft-return: a real network/query error should surface as
      // the college profile's error card, not silently render "no alumni this week".
      if (error) throw error;
      if (!data) return [];

      const rows: WeekAlumnusRow[] = [];
      const preTeeByTournament = new Map<string, Set<string>>();
      for (const r of data as unknown as LbRow[]) {
        const t = r.tournament;
        if (!t) continue;
        const a = alumniById.get(r.player_id);
        if (!a) continue;
        const noScore = r.score == null && r.thru == null && r.today == null;
        if (noScore) {
          if (!preTeeByTournament.has(t.id)) preTeeByTournament.set(t.id, new Set());
          preTeeByTournament.get(t.id)!.add(r.player_id);
        }
        rows.push({
          playerId: r.player_id,
          fullName: a.full_name || `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || 'Alumnus',
          photoUrl: a.photo_url ?? null,
          tourCodes: a.tour_codes ?? null,
          tournamentId: t.id,
          tournamentName: t.name ?? '',
          tournamentStatus: t.status ?? null,
          isLive: t.status === 'inprogress',
          position: r.position ?? null,
          positionTied: r.position_tied ?? null,
          thru: r.thru ?? null,
          score: r.score ?? null,
          today: r.today ?? null,
          status: r.status ?? null,
          money: r.money ?? null,
          teeTime: null,
        });
      }

      // Tee times for pre-tee players — one query for the whole week.
      const preTeeTournamentIds = Array.from(preTeeByTournament.keys());
      const preTeePlayerIds = Array.from(
        new Set(Array.from(preTeeByTournament.values()).flatMap((s) => Array.from(s))),
      );
      if (preTeeTournamentIds.length && preTeePlayerIds.length) {
        interface TeeRow {
          player_id: string;
          tee_time: {
            id: string;
            tournament_id: string | null;
            tee_time: string | null;
            round_number: number | null;
          } | null;
        }
        const { data: teeRows, error: teeErr } = await supabase
          .from('sr_tee_time_players')
          .select(
            'player_id, tee_time:sr_tee_times!inner(id, tournament_id, tee_time, round_number)',
          )
          .in('player_id', preTeePlayerIds)
          .in('tee_time.tournament_id', preTeeTournamentIds);
        if (teeErr) throw teeErr;
        // Pick the latest tee_time per (tournament, player).
        const teeByKey = new Map<string, { time: string; round: number }>();
        for (const tr of (teeRows ?? []) as unknown as TeeRow[]) {
          const t = tr.tee_time;
          if (!t?.tournament_id || !t?.tee_time) continue;
          const key = `${t.tournament_id}|${tr.player_id}`;
          const cur = teeByKey.get(key);
          const round = typeof t.round_number === 'number' ? t.round_number : 0;
          if (!cur || round > cur.round || (round === cur.round && t.tee_time > cur.time)) {
            teeByKey.set(key, { time: t.tee_time, round });
          }
        }
        for (const row of rows) {
          const hit = teeByKey.get(`${row.tournamentId}|${row.playerId}`);
          if (hit) row.teeTime = hit.time;
        }
      }

      rows.sort((a, b) => {
        // Live first, then by position asc (nulls last).
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        const ap = a.position ?? 9999;
        const bp = b.position ?? 9999;
        return ap - bp;
      });
      return rows;
    },
  });
}
