import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { batches } from '@/lib/batches';
import { settled } from './browse/PageLoadGate';
import { readMemberFaces } from '@/lib/members/readMemberFaces';

/**
 * useCourseRecordHolders — the one holder behind each course record in the
 * Courses list and Top 100. Browse player ids join holder ids in one profile
 * read; Top 100 keeps its existing player enrichment and opts out of context.
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
export interface CourseListPlayer { id: string; name: string | null; photoUrl: string | null }

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
export function useCourseRecordHolders(courseIds: readonly string[], { includePlayers = true }: { includePlayers?: boolean } = {}) {
  const ids = useMemo(
    () => Array.from(new Set(courseIds.filter(Boolean))).sort(),
    [courseIds],
  );
  const query = useQuery({
    queryKey: ['course-record-holders', ids, includePlayers],
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [results, contexts] = await Promise.all([Promise.all(
        batches(ids, RECORD_HOLDERS_MAX_IDS).map((chunk) =>
          supabase.rpc('get_course_record_holders' as never, { p_course_ids: chunk } as never),
        ),
      ), includePlayers ? Promise.all(batches(ids, 100).map(chunk =>
        supabase.rpc('get_post_course_context', { p_course_ids: chunk }),
      )) : Promise.resolve([])]);
      for (const result of contexts) if (result.error) throw result.error;
      const contextRows = contexts.flatMap(result => (result.data ?? []) as Array<{ course_id: string; player_ids?: string[] }>);
      for (const result of results) if (result.error) throw result.error;

      const rows = results.flatMap((result) => (result.data ?? []) as Record<string, unknown>[]);
      const holderIds = Array.from(
        new Set(rows.map((row) => (row.holder_id == null ? '' : String(row.holder_id))).filter(Boolean)),
      );

      for (const row of contextRows) for (const id of row.player_ids ?? []) if (!holderIds.includes(id)) holderIds.push(id);
      const playerProfiles = new Map<string, CourseListPlayer>();
      // Sequential on purpose: the holder ids are unknown until the RPC resolves.
      const profiles = new Map<string, string | null>();
      // Visible user_profiles rows first, public_profiles fills the gaps
      // (readMemberFaces), so unconnected public holders and private friends
      // both keep their photos.
      if (holderIds.length > 0) {
        const faces = await readMemberFaces(holderIds);
        for (const face of faces.values()) {
          profiles.set(face.id, face.photoUrl);
          playerProfiles.set(face.id, { id: face.id, name: face.displayName, photoUrl: face.photoUrl });
        }
      }

      const players = new Map<string, CourseListPlayer[]>();
      for (const row of contextRows) players.set(row.course_id, (row.player_ids ?? []).flatMap(id => {
        const p = playerProfiles.get(id); return p ? [p] : [];
      }).slice(0, 3));
      return { map: toRecordHolderMap(rows, profiles), players };
    },
  });

  return { map: query.data?.map ?? EMPTY, players: query.data?.players, settled: settled(query) };
}
