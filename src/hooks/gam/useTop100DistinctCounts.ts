import { useGamRpc } from './_useGamRpc';

export interface Top100DistinctCount {
  slug: string;
  course_count: number;
}

/**
 * Per-list Top 100 course counts (rated OR played) from
 * public.user_top100_distinct_counts. Returns one row per active list
 * unconditionally, so an empty list comes back as 0.
 *
 * Do NOT substitute useUserTop100Progress / useTop100ProgressForUser: they read
 * user_top100_progress_view, which counts rated courses only.
 */
export function useTop100DistinctCounts(userId: string | undefined) {
  const enabled = Boolean(userId);
  return useGamRpc<Top100DistinctCount[]>(
    'user_top100_distinct_counts',
    enabled ? { p_user_id: userId! } : ({} as { p_user_id: string }),
    { enabled, staleTime: 60_000 },
  );
}
