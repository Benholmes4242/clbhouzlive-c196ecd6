/**
 * useLinePicks — the one hook behind a line's picks card: get_line_picks,
 * get_line_pick_result and (settled only) get_line_pick_callers(…, 5), plus an
 * optimistic set_line_pick toggle that rolls back on failure and invalidates
 * every read for the line afterwards. staleTime 60s.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Fns = Database['public']['Functions'];
export type LinePickRow = Fns['get_line_picks']['Returns'][number];
export type LinePickResult = Fns['get_line_pick_result']['Returns'][number];
export type LinePickCaller = Fns['get_line_pick_callers']['Returns'][number];

export interface PickToggle {
  playerKey: string;
  playerId: string;
  playerName: string;
  position: number;
  on: boolean;
}

export function linePicksKey(tour: string, year: number, after: number) {
  return ['players-v2', 'line-picks', tour, year, after] as const;
}

export function useLinePicks(tour: string, seasonYear: number, afterPosition: number, opts: { enabled: boolean; settled: boolean }) {
  const qc = useQueryClient();
  const base = linePicksKey(tour, seasonYear, afterPosition);
  const args = { p_tour: tour, p_year: seasonYear, p_after: afterPosition };

  const picks = useQuery<LinePickRow[]>({
    queryKey: [...base, 'picks'],
    enabled: opts.enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_line_picks', args);
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, mine: r.mine ?? false }));
    },
  });
  const result = useQuery<LinePickResult | null>({
    queryKey: [...base, 'result'],
    enabled: opts.enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_line_pick_result', args);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const callers = useQuery<LinePickCaller[]>({
    queryKey: [...base, 'callers'],
    enabled: opts.enabled && opts.settled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_line_pick_callers', { ...args, p_limit: 5 });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation<number, Error, PickToggle, { prev: LinePickRow[] | undefined }>({
    mutationFn: async (t) => {
      const { data, error } = await supabase.rpc('set_line_pick', {
        ...args, p_player_key: t.playerKey, p_player_id: t.playerId, p_player_name: t.playerName, p_position: t.position, p_on: t.on,
      });
      if (error) throw error;
      return data ?? 0;
    },
    onMutate: async (t) => {
      const k = [...base, 'picks'];
      await qc.cancelQueries({ queryKey: k });
      const prev = qc.getQueryData<LinePickRow[]>(k);
      qc.setQueryData<LinePickRow[]>(k, (rows = []) => {
        const hit = rows.find((r) => r.player_key === t.playerKey);
        const total = rows[0]?.total_pickers ?? 0;
        if (hit) return rows.map((r) => (r.player_key === t.playerKey ? { ...r, mine: t.on, pickers: Math.max(0, r.pickers + (t.on ? 1 : -1)) } : r));
        if (!t.on) return rows;
        return [...rows, { player_key: t.playerKey, player_name: t.playerName, pickers: 1, total_pickers: Math.max(total, 1), mine: true, position_at_pick: t.position, result: null as unknown as string, final_position: null as unknown as number }];
      });
      return { prev };
    },
    onError: (_e, _t, ctx) => {
      qc.setQueryData([...base, 'picks'], ctx?.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: base });
    },
  });

  return { picks, result, callers, toggle };
}
