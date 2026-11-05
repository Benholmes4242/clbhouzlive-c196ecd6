import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RegionKind } from '@/components/explore-tab-new/courseled/boardFilters';
import type { FeatKind } from '../useFeatsWindow';

/** SAR1: RPC owns recent-event qualification, rarity order and yearly counts.
 * No client filtering, sorting, denominator inference or seed fallback. */
export interface StandoutFeat {
  feat_kind: FeatKind;
  events_window: number;
  denominator_unit: 'holes' | 'rounds';
  year_events: number | null;
  year_denominator: number | null;
  viewer_year_events: number;
  hole_no: number | null;
  hole_par: number | null;
  hole_strokes: number | null;
  latest_user_id: string | null;
  latest_display_name: string | null;
  latest_photo_url: string | null;
  latest_score_id: string | null;
  latest_course_id: string | null;
  latest_course_name: string | null;
  latest_play_date: string | null;
}
const nullableNumber = (value: unknown) => value == null ? null : Number(value);
export function mapStandoutFeat(row: StandoutFeat): StandoutFeat {
  return {
    ...row, events_window: Number(row.events_window),
    year_events: nullableNumber(row.year_events), year_denominator: nullableNumber(row.year_denominator),
    viewer_year_events: Number(row.viewer_year_events ?? 0),
    hole_no: nullableNumber(row.hole_no), hole_par: nullableNumber(row.hole_par), hole_strokes: nullableNumber(row.hole_strokes),
    latest_user_id: row.latest_user_id ?? null, latest_display_name: row.latest_display_name ?? null,
    latest_photo_url: row.latest_photo_url ?? null, latest_score_id: row.latest_score_id ?? null,
    latest_course_id: row.latest_course_id ?? null, latest_course_name: row.latest_course_name ?? null,
    latest_play_date: row.latest_play_date ?? null,
  };
}
export function useStandoutFeats(userId: string | undefined, regionKind: RegionKind | null, regionValue: string | null, enabled = true) {
  const args = { p_viewer: userId ?? null, p_region_kind: regionKind, p_region_value: regionValue };
  return useQuery({
    queryKey: ['explore', 'standout-feats', args], enabled: !!userId && enabled, staleTime: 60_000,
    placeholderData: previous => previous,
    queryFn: async (): Promise<StandoutFeat[]> => {
      const { data, error } = await (supabase.rpc as any)('get_standout_feats', args);
      if (error) throw error;
      return ((data ?? []) as StandoutFeat[]).map(mapStandoutFeat);
    },
  });
}