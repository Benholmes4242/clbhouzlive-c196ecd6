/**
 * Hole photography (H2) - member-contributed photographs of a single hole.
 *
 * Three hooks:
 *  - useHolePhoto(courseId, holeNo): the approved photo (credited) plus the
 *    viewer's OWN row for that hole whatever its status.
 *  - useCanContributeHole(courseId): mirrors the RLS insert policy exactly and
 *    returns the proof round id.
 *  - useSubmitHolePhoto(): uploads through the shared media pipeline and writes
 *    a row. `status` is never set - the column default ('pending') is what the
 *    policy requires.
 */
import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMediaUpload } from '@/uploads/hooks/useMediaUpload';
import { AppLog } from '@/lib/logger';

export type HoleMediaStatus = 'pending' | 'approved' | 'rejected';

export interface HoleMediaRow {
  id: string;
  hole_no: number;
  media_url: string;
  width: number | null;
  height: number | null;
  user_id: string;
  status: HoleMediaStatus;
  reject_reason: string | null;
  created_at: string;
}

export interface ApprovedHolePhoto extends HoleMediaRow {
  /** Null when the profile is missing or the member was deleted. */
  contributorName: string | null;
}

export interface HolePhotoState {
  /** Every approved photo, ordered created_at ASC then id ASC (stable). */
  approved: ApprovedHolePhoto[];
  mine: HoleMediaRow | null;
}

export type SubmitFailureReason =
  | 'duplicate'
  | 'rls'
  | 'upload'
  | 'not_signed_in'
  | 'unknown';

export const holeMediaKeys = {
  photo: (courseId?: string, holeNo?: number, userId?: string) =>
    ['hole-media', 'photo', courseId, holeNo, userId] as const,
  eligibility: (courseId?: string, userId?: string) =>
    ['hole-media', 'can-contribute', courseId, userId] as const,
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/** Viewer's LOCAL calendar date as YYYY-MM-DD (never UTC). */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Deterministic 32-bit string hash (djb2-xor), always non-negative. */
function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
    h |= 0; // keep it in int32
  }
  return Math.abs(h);
}

/**
 * Pure, deterministic pick of the photo of the day for a hole.
 * Same input -> same output, for every member, all day long.
 */
export function selectDailyPhoto<T>(
  photos: T[] | null | undefined,
  courseId: string | undefined,
  holeNo: number | undefined,
  date: Date = new Date(),
): T | null {
  if (!photos || photos.length === 0) return null;
  const seed = hashString(`${courseId ?? ''}:${holeNo ?? ''}:${localDateKey(date)}`);
  return photos[seed % photos.length] ?? null;
}

/**
 * (a) All approved photos for a hole (multiple are permitted since H5), plus
 * the viewer's own row in any status. RLS already hides other members'
 * pending/rejected rows.
 */
export function useHolePhotos(courseId?: string, holeNo?: number, userId?: string) {
  return useQuery({
    queryKey: holeMediaKeys.photo(courseId, holeNo, userId),
    enabled: Boolean(courseId && typeof holeNo === 'number'),
    staleTime: 60 * 1000,
    queryFn: async (): Promise<HolePhotoState> => {
      const cols = 'id, hole_no, media_url, width, height, user_id, status, reject_reason, created_at';

      const { data: approvedRows, error: approvedErr } = await supabase
        .from('course_hole_media')
        .select(cols)
        .eq('course_id', courseId!)
        .eq('hole_no', holeNo!)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

      if (approvedErr) throw approvedErr;

      const rows = (approvedRows ?? []) as unknown as HoleMediaRow[];
      let approved: ApprovedHolePhoto[] = [];

      if (rows.length > 0) {
        const ids = Array.from(new Set(rows.map((r) => r.user_id)));
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username')
          .in('id', ids);
        const nameById = new Map<string, string | null>(
          (profiles ?? []).map((p: { id: string; display_name: string | null; username: string | null }) => [
            p.id,
            p.display_name || p.username || null,
          ]),
        );
        approved = rows.map((row) => ({
          ...row,
          contributorName: nameById.get(row.user_id) ?? null,
        }));
      }

      let mine: HoleMediaRow | null = null;
      if (userId) {
        const { data: myRows, error: myErr } = await supabase
          .from('course_hole_media')
          .select(cols)
          .eq('course_id', courseId!)
          .eq('hole_no', holeNo!)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (myErr) throw myErr;
        mine = ((myRows ?? [])[0] as unknown as HoleMediaRow) ?? null;
      }

      return { approved, mine };
    },
  });
}


export interface ContributeEligibility {
  canContribute: boolean;
  proofScoreId: string | null;
}

/**
 * (b) Mirrors the chm_insert RLS policy:
 *
 *   EXISTS (SELECT 1
 *     FROM whs_scores s
 *     JOIN whs_connections wc ON wc.id = s.connection_id
 *     JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
 *     WHERE wc.user_id = auth.uid()
 *       AND wc.deleted_at IS NULL
 *       AND m.golf_course_id = course_hole_media.course_id)
 *
 * Same three tables, same predicates, walked client-side; the most recent
 * matching whs_scores.id becomes proof_score_id.
 */
export function useCanContributeHole(courseId?: string, userId?: string) {
  return useQuery({
    queryKey: holeMediaKeys.eligibility(courseId, userId),
    enabled: Boolean(courseId && userId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ContributeEligibility> => {
      const { data: conns, error: connErr } = await supabase
        .from('whs_connections')
        .select('id')
        .eq('user_id', userId!)
        .is('deleted_at', null);
      if (connErr) throw connErr;
      const connectionIds = (conns ?? []).map((c: { id: string }) => c.id);
      if (connectionIds.length === 0) return { canContribute: false, proofScoreId: null };

      const { data: maps, error: mapErr } = await supabase
        .from('whs_to_golf_course_map')
        .select('whs_course_id')
        .eq('golf_course_id', courseId!);
      if (mapErr) throw mapErr;
      const whsCourseIds = (maps ?? []).map((m: { whs_course_id: string }) => m.whs_course_id);
      if (whsCourseIds.length === 0) return { canContribute: false, proofScoreId: null };

      const { data: scores, error: scoreErr } = await supabase
        .from('whs_scores')
        .select('id, play_date')
        .in('connection_id', connectionIds)
        .in('course_id', whsCourseIds)
        .order('play_date', { ascending: false })
        .limit(1);
      if (scoreErr) throw scoreErr;

      const proof = (scores ?? [])[0] as { id: string } | undefined;
      return { canContribute: Boolean(proof), proofScoreId: proof?.id ?? null };
    },
  });
}

interface SubmitArgs {
  courseId: string;
  holeNo: number;
  file: File;
  proofScoreId: string | null;
}

export interface SubmitResult {
  ok: boolean;
  reason?: SubmitFailureReason;
  message?: string;
}

/** (c) Upload via the shared pipeline, then insert. Never sets `status`. */
export function useSubmitHolePhoto() {
  const { upload, progress } = useMediaUpload();
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submit = useCallback(
    async ({ courseId, holeNo, file, proofScoreId }: SubmitArgs): Promise<SubmitResult> => {
      setSubmitting(true);
      try {
        const userId = await currentUserId();
        if (!userId) return { ok: false, reason: 'not_signed_in' };

        if (!file.type.startsWith('image/')) {
          return { ok: false, reason: 'upload', message: 'not_an_image' };
        }

        const result = await upload(file, {
          destination: 'r2',
          bucketType: 'clbhouz-course-images',
        });
        if (!result.success || !result.mediaUrl) {
          return { ok: false, reason: 'upload', message: result.error?.message };
        }

        const { error } = await supabase.from('course_hole_media').insert({
          course_id: courseId,
          hole_no: holeNo,
          user_id: userId,
          media_url: result.mediaUrl,
          file_name: file.name,
          width: result.width ?? null,
          height: result.height ?? null,
          proof_score_id: proofScoreId,
        });

        if (error) {
          const code = (error as { code?: string }).code;
          if (code === '23505') return { ok: false, reason: 'duplicate' };
          if (code === '42501') return { ok: false, reason: 'rls' };
          throw error;
        }

        await queryClient.invalidateQueries({ queryKey: ['hole-media', 'photo', courseId, holeNo] });
        return { ok: true };
      } catch (err) {
        AppLog.error('[useSubmitHolePhoto]', 'Failed to submit hole photo', err);
        return { ok: false, reason: 'unknown' };
      } finally {
        setSubmitting(false);
      }
    },
    [upload, queryClient],
  );

  /** Rejected rows are deleted by the owner, then re-submitted. */
  const deleteMine = useCallback(
    async (rowId: string, courseId: string, holeNo: number) => {
      const { error } = await supabase.from('course_hole_media').delete().eq('id', rowId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['hole-media', 'photo', courseId, holeNo] });
    },
    [queryClient],
  );

  return { submit, deleteMine, submitting, progress };
}
