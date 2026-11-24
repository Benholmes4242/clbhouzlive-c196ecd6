import { useMemo } from 'react';

import { useGamRpc } from '@/hooks/gam/_useGamRpc';

/**
 * BRIEF_TOP100_MONTHLY_MOVE — the golfers' order four weeks ago, per course,
 * for one Top 100 list. The server reads the newest weekly snapshot that is
 * 28–42 days old; until four weeks of snapshots exist it returns no rows and
 * every row shows no trend line (the section looks exactly as it did before).
 *
 * This read must never block or delay the section: the map is EMPTY while
 * loading or on error, and the caller renders without it.
 */
export function useTop100GolferBaseline(listSlug: string | null | undefined): Map<string, number> {
  const { data } = useGamRpc<Array<{ snapshot_date: string; course_id: string; golfer_position: number }>>(
    'get_top100_golfer_rank_baseline',
    { p_list_slug: listSlug },
    { enabled: !!listSlug, staleTime: 60 * 60 * 1000 },
  );
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const row of data ?? []) map.set(row.course_id, row.golfer_position);
    return map;
  }, [data]);
}
