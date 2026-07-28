/**
 * Hole photography (H1/H2) — member-contributed photos of individual holes.
 *
 * Reads approved photos for a course, reads the viewer's own submissions
 * (any status), and submits a new one via the shared media upload path.
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
  user_id: string;
  status: HoleMediaStatus;
  created_at: string;
  reject_reason?: string | null;
}

export interface ApprovedHolePhoto extends HoleMediaRow {
  contributorName: string | null;
}

export const holeMediaKeys = {
  approved: (courseId?: string) => ['course-hole-media', 'approved', courseId] as const,
  mine: (courseId?: string, userId?: string) =>
    ['course-hole-media', 'mine', courseId, userId] as const,
};

/** Approved photos for a course, keyed by hole number. */
export function useApprovedHoleMedia(courseId?: string) {
  return useQuery({
    queryKey: holeMediaKeys.approved(courseId),
    enabled: Boolean(courseId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Map<number, ApprovedHolePhoto>> => {
      const { data, error } = await supabase
        .from('course_hole_media')
        .select('id, hole_no, media_url, user_id, status, created_at')
        .eq('course_id', courseId!)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      const rows = (data ?? []) as HoleMediaRow[];
      if (rows.length === 0) return new Map();

      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username')
        .in('id', userIds);

      const nameById = new Map<string, string | null>();
      (profiles ?? []).forEach((p: { id: string; display_name: string | null; username: string | null }) => {
        nameById.set(p.id, p.display_name || p.username || null);
      });

      const map = new Map<number, ApprovedHolePhoto>();
      rows.forEach((r) => {
        // Earliest approved photo wins (one photo per hole for now).
        if (!map.has(r.hole_no)) {
          map.set(r.hole_no, { ...r, contributorName: nameById.get(r.user_id) ?? null });
        }
      });
      return map;
    },
  });
}

/** The viewer's own submissions for a course, keyed by hole number. */
export function useMyHoleMedia(courseId?: string, userId?: string) {
  return useQuery({
    queryKey: holeMediaKeys.mine(courseId, userId),
    enabled: Boolean(courseId && userId),
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Map<number, HoleMediaRow>> => {
      const { data, error } = await supabase
        .from('course_hole_media')
        .select('id, hole_no, media_url, user_id, status, created_at, reject_reason')
        .eq('course_id', courseId!)
        .eq('user_id', userId!);

      if (error) throw error;
      const map = new Map<number, HoleMediaRow>();
      ((data ?? []) as HoleMediaRow[]).forEach((r) => map.set(r.hole_no, r));
      return map;
    },
  });
}

interface SubmitArgs {
  courseId: string;
  holeNo: number;
  file: File;
}

/**
 * Uploads the image through the shared media pipeline (R2) and writes a
 * pending row. proof_score_id is the member's most recent round at the course.
 */
export function useSubmitHolePhoto() {
  const { upload, progress } = useMediaUpload();
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submit = useCallback(
    async ({ courseId, holeNo, file }: SubmitArgs): Promise<{ ok: boolean; error?: string }> => {
      setSubmitting(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) return { ok: false, error: 'Sign in to add a photo.' };

        const result = await upload(file, {
          destination: 'r2',
          bucketType: 'clbhouz-course-images',
        });

        if (!result.success || !result.mediaUrl) {
          return { ok: false, error: result.error?.message ?? 'Upload failed' };
        }

        // Most recent round at this course = the proof they were there.
        const { data: proof } = await supabase
          .from('gam_round_stats')
          .select('whs_score_id, play_date')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .order('play_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error } = await supabase.from('course_hole_media').insert({
          course_id: courseId,
          hole_no: holeNo,
          user_id: userId,
          media_url: result.mediaUrl,
          file_name: file.name,
          width: result.width ?? null,
          height: result.height ?? null,
          status: 'pending',
          proof_score_id: proof?.whs_score_id ?? null,
        });

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: holeMediaKeys.mine(courseId, userId) });
        return { ok: true };
      } catch (err) {
        AppLog.error('[useSubmitHolePhoto]', 'Failed to submit hole photo', err);
        const message = err instanceof Error ? err.message : 'Something went wrong';
        return { ok: false, error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [upload, queryClient],
  );

  return { submit, submitting, progress };
}
