import { useMemo } from 'react';

import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { CourseCardMeta } from './useCourseCardMeta';

/**
 * REGION COUNTS FOR THE ROUNDS SECTION
 * (BRIEF_MERGE_CIRCLE_AND_GOLF_THIS_WEEK §S3).
 *
 * ONE QUERY FOR THE WHOLE LIST (§S3.7) — and in fact NO NEW QUERY AT ALL. The
 * section already reads `golf_courses` once for every course on screen
 * (useCourseCardMeta), so the geography of the week is already in memory: this
 * hook groups it. A second read, or one read per region row, would be a worse
 * answer to the same question.
 *
 * COUNTS RESPECT THE ACTIVE PILL (§S3.6) because the caller passes the rounds
 * the ACTIVE SCOPE returned. Nothing here knows about scopes.
 *
 * VOCABULARY is the Courses browse's own (§S3.1): `golf_courses.country` is the
 * macro area ("Britain & Ireland"), `sub_country` the nation ("Scotland").
 */

export interface RegionSelection {
  /** 'country' = macro area, 'sub_country' = nation. */
  kind: 'country' | 'sub_country';
  value: string;
}

export interface RegionCountRow {
  country: string;
  count: number;
  subs: { sub_country: string; count: number }[];
}

export interface WeekRegions {
  /** Grouped rows, biggest area first, each carrying its round count. */
  groups: RegionCountRow[];
  /** Total rounds in the active scope, whatever their geography. */
  total: number;
  /** Rounds we hold no geography for — never silently counted into an area. */
  unknown: number;
  /** Does this round belong to the selection? Unmatched rounds fail. */
  matches: (row: CircleRoundRow, sel: RegionSelection | null) => boolean;
}

export function useWeekRegionCounts(
  rows: readonly CircleRoundRow[],
  meta: Map<string, CourseCardMeta> | undefined,
): WeekRegions {
  return useMemo(() => {
    const areaCounts = new Map<string, Map<string, number>>();
    let unknown = 0;

    for (const r of rows) {
      const m = r.course_id ? meta?.get(r.course_id) : undefined;
      const country = m?.country ?? null;
      if (!country) {
        unknown += 1;
        continue;
      }
      const sub = m?.subCountry ?? '';
      const subs = areaCounts.get(country) ?? new Map<string, number>();
      subs.set(sub, (subs.get(sub) ?? 0) + 1);
      areaCounts.set(country, subs);
    }

    const groups: RegionCountRow[] = [...areaCounts.entries()]
      .map(([country, subs]) => {
        const list = [...subs.entries()]
          .filter(([sub]) => !!sub)
          .map(([sub_country, count]) => ({ sub_country, count }))
          .sort((a, b) => b.count - a.count || a.sub_country.localeCompare(b.sub_country));
        const count = [...subs.values()].reduce((n, v) => n + v, 0);
        return { country, count, subs: list };
      })
      /* Ordered by ROUNDS, never alphabetically: the busiest area is the one a
         member is most likely to be looking for. */
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));

    const matches = (row: CircleRoundRow, sel: RegionSelection | null) => {
      if (!sel) return true;
      const m = row.course_id ? meta?.get(row.course_id) : undefined;
      if (!m) return false;
      return sel.kind === 'country' ? m.country === sel.value : m.subCountry === sel.value;
    };

    return { groups, total: rows.length, unknown, matches };
  }, [rows, meta]);
}
