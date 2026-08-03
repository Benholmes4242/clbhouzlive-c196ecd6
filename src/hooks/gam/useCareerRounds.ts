/**
 * Career rounds -- one read of gam_round_stats powering every derived figure
 * in the career record: the header sample line, the per-course distribution
 * ("where") and the evidence round for a counting stat or a milestone.
 *
 * RLS: own rows always, plus England-Golf-synced peers. In friend view where
 * the policy denies the rows the hook simply returns an empty list and the
 * dependent lines self-hide.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CareerRoundRow {
  whs_score_id: string;
  play_date: string;
  course_id: string | null;
  course_name: string | null;
  course_par: number | null;
  gross_score: number | null;
  stableford_points: number | null;
  score_diff: number | null;
  birdies: number | null;
  eagles: number | null;
  albatrosses: number | null;
  holes_in_one: number | null;
  longest_birdie_run: number | null;
  beat_par: boolean | null;
  sub_70: boolean | null;
  sub_80: boolean | null;
  sub_90: boolean | null;
  sub_100: boolean | null;
  clean_card: boolean | null;
}

const COLUMNS =
  'whs_score_id, play_date, course_id, course_name, course_par, gross_score, stableford_points, score_diff, birdies, eagles, albatrosses, holes_in_one, longest_birdie_run, beat_par, sub_70, sub_80, sub_90, sub_100, clean_card';

export function useCareerRounds(userId: string | undefined) {
  return useQuery({
    queryKey: ['gam', 'career-rounds', userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CareerRoundRow[]> => {
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select(COLUMNS)
        .eq('user_id', userId as string)
        .order('play_date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as CareerRoundRow[];
    },
  });
}

/** Per-round metric columns a counting stat can be traced back to. */
export type RoundMetric = 'birdies' | 'eagles' | 'albatrosses' | 'holes_in_one';

/** Maps a badge counter_metric onto a per-round column, when one exists. */
export function roundMetricForCounter(metric: string | null): RoundMetric | null {
  switch (metric) {
    case 'birdies':
      return 'birdies';
    case 'eagles':
      return 'eagles';
    case 'albatrosses':
      return 'albatrosses';
    case 'holes_in_one':
      return 'holes_in_one';
    default:
      return null;
  }
}

export interface CourseSplit {
  courseId: string;
  courseName: string;
  count: number;
}

/** Distribution of a metric across the member's courses, highest first. */
export function courseSplitFor(rows: CareerRoundRow[], metric: RoundMetric): CourseSplit[] {
  const map = new Map<string, CourseSplit>();
  for (const row of rows) {
    const n = Number(row[metric] ?? 0);
    if (!n) continue;
    const key = row.course_id || `name:${row.course_name ?? 'unknown'}`;
    const existing = map.get(key);
    if (existing) existing.count += n;
    else
      map.set(key, {
        courseId: row.course_id ?? '',
        courseName: row.course_name ?? 'A course',
        count: n,
      });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/** The round with the most of a metric. Ties break to the most recent. */
export function bestRoundFor(rows: CareerRoundRow[], metric: RoundMetric): CareerRoundRow | null {
  let best: CareerRoundRow | null = null;
  let bestN = 0;
  for (const row of rows) {
    const n = Number(row[metric] ?? 0);
    if (n > bestN) {
      best = row;
      bestN = n;
    }
  }
  return best;
}

/**
 * The earliest round that satisfies a binary milestone. Milestones that
 * predate hole-by-hole scoring have no qualifying row and the detail view
 * says so rather than inventing one.
 */
export function milestoneRoundFor(rows: CareerRoundRow[], badgeId: string): CareerRoundRow | null {
  const test = (row: CareerRoundRow): boolean => {
    switch (badgeId) {
      case 'beat_par':
        return row.beat_par === true;
      case 'break_70':
        return row.sub_70 === true;
      case 'break_80':
        return row.sub_80 === true;
      case 'break_90':
        return row.sub_90 === true;
      case 'break_100':
        return row.sub_100 === true;
      case 'clean_card':
        return row.clean_card === true;
      case 'five_birdie_round':
        return Number(row.birdies ?? 0) >= 5;
      case 'eagle_master':
        return Number(row.eagles ?? 0) >= 1;
      case 'two_eagles':
        return Number(row.eagles ?? 0) >= 2;
      case 'birdie_train':
        return Number(row.longest_birdie_run ?? 0) >= 3;
      default:
        return false;
    }
  };
  const matches = rows.filter(test);
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

export default useCareerRounds;
