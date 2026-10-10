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
  /**
   * ROUNDS whose hole count was not on file, never holes (live value 0).
   * Nothing renders it: it exists to prove the denominator is counted rather
   * than inferred. board_pool has already filtered to eighteen-hole rounds,
   * so the fallback cannot move total_holes.
   */
  rounds_estimated: number;
  /** The viewer's own count of the thing, and of rounds containing it. */
  viewer_events: number;
  viewer_rounds_with: number;
  /** Newest occurrence in this window; all null when there is none. */
  latest_user_id: string | null;
  latest_display_name: string | null;
  /** Returned but not rendered on the tile — an avatar would compete with the count. */
  latest_photo_url: string | null;
  latest_score_id: string | null;
  latest_course_id: string | null;
  latest_course_name: string | null;
  latest_play_date: string | null;
}

/**
 * Live per-request figures from get_feats_window (same board_pool/board_qualifies
 * pair the boards use). Nothing stored or snapshotted — a synced round changes
 * the next read. No client filtering or sorting: the RPC returns all four feats
 * in display order, rarest first, including a feat with zero occurrences.
 */
export type FeatWindow = 'year' | 'all';

export function useFeatsWindow(userId: string | undefined, window: FeatWindow, enabled = true) {
  return useQuery<FeatYearRow[]>({
    queryKey: ['explore', 'feats-window', userId, window],
    enabled,
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
        rounds_estimated: Number(r.rounds_estimated),
        viewer_events: Number(r.viewer_events ?? 0),
        viewer_rounds_with: Number(r.viewer_rounds_with ?? 0),
        latest_user_id: r.latest_user_id ?? null,
        latest_display_name: r.latest_display_name ?? null,
        latest_photo_url: r.latest_photo_url ?? null,
        latest_score_id: r.latest_score_id ?? null,
        latest_course_id: r.latest_course_id ?? null,
        latest_course_name: r.latest_course_name ?? null,
        latest_play_date: r.latest_play_date ?? null,
      }));
    },
  });
}
