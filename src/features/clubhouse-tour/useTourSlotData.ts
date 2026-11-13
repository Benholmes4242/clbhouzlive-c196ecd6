/** Slot reads existing published tournament/prediction data only. Pagination
 * prevents row-cap truncation; no generation, sync, ranking or feed writes.
 * Visit identity outlives virtualized card mounts; a shown card retains its
 * last settled payload on errors or expiry rather than collapsing. */
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { CachedTournament } from '@/hooks/useTournamentsCache';
import { readStoredTour } from '@/features/tourhub/hooks/useTourSelection';
import { advanceTourSlotCursor, orderTourSlots, resolveTourSlot, type SlotTournament, type SlotPick, type SlotSelection } from './tourSlotRules';

export interface SlotPayload { tournaments: SlotTournament[]; predictions: Map<string, SlotPick[]>; boards: Map<string, BoardEntry[]> }
export interface TourSlotVisit { cursor: number; ready: boolean; selected: SlotSelection | null; snapshot: SlotPayload | null; shown: Set<string> }
export function useTourSlotVisit() {
  const visit = useRef<TourSlotVisit>({ cursor: 0, ready: false, selected: null, snapshot: null, shown: new Set() });
  const [, setReady] = useState(false);
  const advanced = useRef(false);
  useEffect(() => {
    if (advanced.current) return;
    advanced.current = true;
    try { visit.current.cursor = advanceTourSlotCursor(window.localStorage); } catch { visit.current.cursor = 0; }
    visit.current.ready = true;
    setReady(true);
  }, []);
  return visit.current;
}
export async function fetchTourSlotData(): Promise<SlotPayload> {
  const tournaments: CachedTournament[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await supabase.from('sr_tournaments')
      .select('*, season:sr_seasons!inner(id, tour_id, tour_name, year)')
      .in('status', ['scheduled', 'inprogress', 'closed', 'complete'])
      .in('season.tour_name', ['pga','PGA','lpga','LPGA','euro','EURO','champ','CHAMP','pgad','PGAD'])
      .order('id').range(offset, offset + 499);
    if (result.error) throw result.error;
    const page = result.data ?? [];
    tournaments.push(...page as unknown as CachedTournament[]);
    if (page.length < 500) break;
  }
  // Expired results do not need companion reads; every scheduled/live event
  // stays in the candidate set, independent of the shared hero's time window.
  const eligible = resolveTourSlot(tournaments.filter(t => ['closed','complete'].includes(t.status)).map(t => ({ ...t, locksAt: null })), new Map(), new Map(), new Date());
  const candidates = tournaments.filter(t => ['scheduled','inprogress'].includes(t.status) || eligible.some(e => e.tournament.id === t.id));
  const predictions = new Map<string, SlotPick[]>();
  const boards = new Map<string, BoardEntry[]>();
  for (let start = 0; start < candidates.length; start += 50) {
    const ids = candidates.slice(start, start + 50).map(t => t.id);
    const readPredictions = async () => {
      for (let offset = 0; ; offset += 500) {
        const result = await supabase.from('ai_predictions').select('tournament_id, predictions, generated_at, id')
          .in('tournament_id', ids).order('generated_at', { ascending: false }).order('id').range(offset, offset + 499);
        if (result.error) throw result.error;
        for (const row of result.data ?? []) {
          if (predictions.has(row.tournament_id)) continue;
          const raw = Array.isArray(row.predictions) ? row.predictions : [];
          const picks = raw.flatMap(p => {
            if (!p || typeof p !== 'object' || Array.isArray(p)) return [];
            return typeof p.rank === 'number' && typeof p.playerId === 'string' && typeof p.playerName === 'string'
              ? [{ rank: p.rank, playerId: p.playerId, playerName: p.playerName }] : [];
          }).filter(p => p.rank >= 1 && p.rank <= 3).sort((a,b) => a.rank - b.rank);
          predictions.set(row.tournament_id, picks);
        }
        if ((result.data?.length ?? 0) < 500) break;
      }
    };
    const readBoards = async () => {
      for (let offset = 0; ; offset += 500) {
        const result = await supabase.from('sr_leaderboards')
          .select('*, player:sr_players!sr_leaderboards_player_id_fkey(id, sr_id, full_name, first_name, last_name), team:sr_teams!sr_leaderboards_team_id_fkey(id, display_name)')
          .in('tournament_id', ids).order('position', { ascending: true, nullsFirst: false }).order('id').range(offset, offset + 499);
        if (result.error) throw result.error;
        for (const raw of result.data ?? []) {
          const row = raw as unknown as BoardEntry & { tournament_id: string };
          const board = boards.get(row.tournament_id) ?? [];
          board.push(row); boards.set(row.tournament_id, board);
        }
        if ((result.data?.length ?? 0) < 500) break;
      }
    };
    await Promise.all([readPredictions(), readBoards()]);
  }
  const withLocks = await Promise.all(candidates.map(async tournament => {
    if (tournament.status !== 'scheduled') return { ...tournament, locksAt: null };
    const result = await supabase.rpc('tournament_pick_locks_at', { p_tournament_id: tournament.id });
    if (result.error) throw result.error;
    return { ...tournament, locksAt: typeof result.data === 'string' ? result.data : null };
  }));
  return { tournaments: withLocks, predictions, boards };
}
export function useTourSlotData(visit: TourSlotVisit, selectedTour: string | null) {
  const query = useQuery({ queryKey: ['clubhouse-tour-slot','data'], queryFn: fetchTourSlotData, staleTime: 60_000, refetchInterval: 60_000, retry: false });
  if (visit.ready && query.isSuccess && query.data) {
    const list = orderTourSlots(resolveTourSlot(query.data.tournaments, query.data.predictions, query.data.boards, new Date()), selectedTour ?? readStoredTour());
    if (!visit.selected && list.length) visit.selected = list[visit.cursor % list.length];
    if (visit.selected) {
      const refreshed = list.find(item => item.tournament.id === visit.selected?.tournament.id);
      if (refreshed) { visit.selected = refreshed; visit.snapshot = query.data; }
    }
  }
  return { selection: visit.selected, payload: visit.snapshot };
}