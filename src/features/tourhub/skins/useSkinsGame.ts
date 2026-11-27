/** Brief 47: a skins game's result from the board's own scorecard read
 * (useBoardHoles, round 1, the same cache the scorecard sheet and hero round
 * panel use). Disabled for every other event, so standard pages make no read. */
import { useMemo } from 'react';
import { useBoardHoles } from '../leaderboard/useBoardHoles';
import type { BoardEntry } from '../leaderboard/BoardTable';
import { skinsFromScorecards, type SkinsResult } from './skinsRules';

export function useSkinsGame(tournamentId: string | null | undefined, entries: BoardEntry[], enabled: boolean, boardUpdatedAt = 0): { result: SkinsResult | null; isLoading: boolean; entryById: Map<string, BoardEntry> } {
  const q = useBoardHoles(enabled ? tournamentId ?? null : null, enabled ? 1 : null, boardUpdatedAt, enabled);
  const entryById = useMemo(() => {
    const m = new Map<string, BoardEntry>();
    for (const e of entries) if (e.player?.id) m.set(e.player.id, e);
    return m;
  }, [entries]);
  const result = useMemo(() => {
    if (!enabled || !q.data || q.isError) return null;
    return skinsFromScorecards([...entryById.values()].map((e) => ({ id: e.player!.id, name: e.player!.full_name, holes: q.byPlayer.get(e.player!.id) ?? [] })));
  }, [enabled, q.data, q.isError, q.byPlayer, entryById]);
  return { result, isLoading: enabled && q.isLoading, entryById };
}
