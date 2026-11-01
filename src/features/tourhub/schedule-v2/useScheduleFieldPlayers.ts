/**
 * useScheduleFieldPlayers — ONE batched read of each event's field for the
 * rebuilt schedule's "★ … in the field" line (BRIEF_TOUR_SCHEDULE_REBUILT §7).
 *
 * - Upcoming events starting in the next 14 days: round-1 tee times
 *   (sr_tee_times → sr_tee_time_players), one query for all of them.
 * - Live events: the existing leaderboard table (sr_leaderboards), one query.
 *
 * Returns a Map<tournamentId, FieldPlayer[]> (player id + full name). Never
 * one query per row; empty inputs issue no read.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { daysUntil } from './timelineUtils';
import type { FieldPlayer } from './scheduleRules';

export const FIELD_TEE_WINDOW_DAYS = 14;

function playerName(p: any): string {
  return (
    p?.full_name ||
    `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() ||
    ''
  );
}

export function useScheduleFieldPlayers(
  upcoming: { id: string; startDate: string }[],
  liveIds: string[],
): Map<string, FieldPlayer[]> {
  const teeIds = useMemo(
    () =>
      upcoming
        .filter((u) => {
          const d = daysUntil(u.startDate);
          return d !== null && d <= FIELD_TEE_WINDOW_DAYS;
        })
        .map((u) => u.id)
        .sort(),
    [upcoming],
  );
  const boardIds = useMemo(() => [...liveIds].sort(), [liveIds]);

  const teeQuery = useQuery({
    queryKey: ['schedule-v2', 'field-tee-times', teeIds],
    enabled: teeIds.length > 0,
    staleTime: 15 * 60 * 1000,
    queryFn: async (): Promise<Map<string, FieldPlayer[]>> => {
      const { data, error } = await supabase
        .from('sr_tee_times')
        .select(
          `tournament_id, players:sr_tee_time_players(player_id, player:sr_players(full_name, first_name, last_name))`,
        )
        .in('tournament_id', teeIds)
        .eq('round_number', 1);
      if (error) {
        console.warn('[schedule-v2] tee-time field read failed:', error.message);
        return new Map();
      }
      const map = new Map<string, FieldPlayer[]>();
      for (const row of (data ?? []) as any[]) {
        const tid = row.tournament_id as string;
        const list = map.get(tid) ?? [];
        for (const tp of row.players ?? []) {
          const name = playerName(tp?.player);
          if (!tp?.player_id || !name) continue;
          if (list.some((p) => p.id === tp.player_id)) continue;
          list.push({ id: tp.player_id, name });
        }
        map.set(tid, list);
      }
      return map;
    },
  });

  const boardQuery = useQuery({
    queryKey: ['schedule-v2', 'field-leaderboards', boardIds],
    enabled: boardIds.length > 0,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Map<string, FieldPlayer[]>> => {
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          `tournament_id, player_id, player:sr_players!sr_leaderboards_player_id_fkey(full_name, first_name, last_name)`,
        )
        .in('tournament_id', boardIds);
      if (error) {
        console.warn('[schedule-v2] leaderboard field read failed:', error.message);
        return new Map();
      }
      const map = new Map<string, FieldPlayer[]>();
      for (const row of (data ?? []) as any[]) {
        const tid = row.tournament_id as string;
        const name = playerName(row.player);
        if (!row.player_id || !name) continue;
        const list = map.get(tid) ?? [];
        if (list.some((p) => p.id === row.player_id)) continue;
        list.push({ id: row.player_id, name });
        map.set(tid, list);
      }
      return map;
    },
  });

  return useMemo(() => {
    const map = new Map<string, FieldPlayer[]>();
    teeQuery.data?.forEach((v, k) => map.set(k, v));
    boardQuery.data?.forEach((v, k) => map.set(k, v));
    return map;
  }, [teeQuery.data, boardQuery.data]);
}
