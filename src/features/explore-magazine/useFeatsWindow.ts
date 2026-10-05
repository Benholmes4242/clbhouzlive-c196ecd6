import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeatKind = 'ace' | 'albatross' | 'eagle' | 'clean_card';

export interface FeatYearRow {
  feat_kind: FeatKind;
  /** The number of the THING — eagles, not rounds containing an eagle. */
  events: number;
  /** Rounds containing it. This is what the see-all sheet lists, and on eagles it is SMALLER than events. */
  rounds_with: number;
  members: number;
  /** Already the right unit for this feat: holes for ace/albatross/eagle, rounds for clean_card. Never choose between the totals at the call site. */
  denominator: number;
  denominator_unit: 'holes' | 'rounds';
  total_rounds: number;
  total_holes: number;
  total_members: number;
  holes_estimated: number;
}

/**
 * Live per-request figures from get_feats_window (same board_pool/board_qualifies
 * pair the boards use). Nothing stored or snapshotted — a synced round changes
 * the next read. No client filtering or sorting: the RPC returns display order.
 */
export type FeatWindow = 'year' | 'all';

export function useFeatsWindow(userId: string | undefined, window: FeatWindow) {
  return useQuery<FeatYearRow[]>({
    queryKey: ['explore', 'feats-window', userId, window],
    staleTime: 60_000,
    // Hold the previous window's rows while the next loads so the rail keeps its height.
    placeholderData: (prev) => prev,
    queryFn: async () => {
      // RPC is newer than the generated types.
      const { data, error } = await (supabase.rpc as any)('get_feats_window', { p_viewer: userId ?? null, p_window: window });
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        feat_kind: r.feat_kind as FeatKind,
        events: Number(r.events),
        rounds_with: Number(r.rounds_with),
        members: Number(r.members),
        denominator: Number(r.denominator),
        denominator_unit: r.denominator_unit as 'holes' | 'rounds',
        total_rounds: Number(r.total_rounds),
        total_holes: Number(r.total_holes),
        total_members: Number(r.total_members),
        holes_estimated: Number(r.holes_estimated),
      }));
    },
  });
}
