import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { batches } from '@/lib/batches';
import { settled } from './browse/PageLoadGate';

/**
 * useCourseRecordHolders — the one holder behind each course record in the
 * Courses list (BRIEF_COURSES_LIST_PHOTO_CARDS §3b).
 *
 * `get_course_record_holders(p_course_ids)` reads the same row, with the same
 * ordering, as `get_post_course_context`'s record — so the list names the same
 * holder the Courses hero and the Top 100 card name. Guests may call it. The
 * generated types do not carry it yet, hence the cast every new RPC here gets.
 *
 * The profile read is sequential on purpose, exactly as `useTop100Enrichment`
 * reads faces: the holder ids are unknown until the RPC resolves, and the
 * alternative is a second cache entry for the same fact.
 */

/** The RPC's ceiling: never send more ids than one call may carry. */
export const RECORD_HOLDERS_MAX_IDS = 100;

/** One row of get_course_record_holders, coerced. */
export interface CourseRecordHolder {
  courseId: string;
  recordGross: number;
  holderId: string;
  holderName: string;
}

/** That row plus the holder's face, from the one batched profile read. */
export type CourseRecordHolderEntry = CourseRecordHolder & { photoUrl: string | null };

const EMPTY = new Map<string, CourseRecordHolderEntry>();

/**
 * Rows → course-keyed map. A row missing its course id, a numeric record gross
 * or a holder id is dropped: the card's show rule needs all three, and a name
 * the server could not resolve stays an empty string rather than a username.
 */
export function toRecordHolderMap(
  rows: readonly Record<string, unknown>[],
  profiles: ReadonlyMap<string, string | null>,
): Map<string, CourseRecordHolderEntry> {
  const out = new Map<string, CourseRecordHolderEntry>();
  for (const row of rows) {
    const courseId = row.course_id == null ? '' : String(row.course_id);
    const holderId = row.holder_id == null ? '' : String(row.holder_id);
    const gross = Number(row.record_gross);
    if (!courseId || !holderId || !Number.isFinite(gross)) continue;
    out.set(courseId, {
      courseId,
      holderId,
      recordGross: gross,
      holderName: row.holder_name == null ? '' : String(row.holder_name),
      photoUrl: profiles.get(holderId) ?? null,
    });
  }
  return out;
}

/** One read per loaded page of rows, keyed on the sorted, de-duplicated id set. */
export function useCourseRecordHolders(courseIds: readonly string[]) {
  const ids = useMemo(
    () => Array.from(new Set(courseIds.filter(Boolean))).sort(),
    [courseIds],
  );
  const query = useQuery({
    queryKey: ['course-record-holders', ids],
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Map<string, CourseRecordHolderEntry>> => {
      const results = await Promise.all(
        batches(ids, RECORD_HOLDERS_MAX_IDS).map((chunk) =>
          supabase.rpc('get_course_record_holders' as never, { p_course_ids: chunk } as never),
        ),
      );
      for (const result of results) if (result.error) throw result.error;

      const rows = results.flatMap((result) => (result.data ?? []) as Record<string, unknown>[]);
      const holderIds = Array.from(
        new Set(rows.map((row) => (row.holder_id == null ? '' : String(row.holder_id))).filter(Boolean)),
      );

      // Sequential on purpose: the holder ids are unknown until the RPC resolves.
      const profiles = new Map<string, string | null>();
      if (holderIds.length > 0) {
        const profRes = await supabase
          .from('user_profiles')
          .select('id, profile_photo_url')
          .in('id', holderIds)
          .is('deleted_at', null);
        if (profRes.error) throw profRes.error;
        for (const profile of (profRes.data ?? []) as Array<{ id: string; profile_photo_url: string | null }>) {
          profiles.set(String(profile.id), profile.profile_photo_url ?? null);
        }
      }

      return toRecordHolderMap(rows, profiles);
    },
  });

  return { map: query.data ?? EMPTY, settled: settled(query) };
}
