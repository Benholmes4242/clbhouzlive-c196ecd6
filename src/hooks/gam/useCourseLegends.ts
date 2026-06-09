import { useGamRpc } from './_useGamRpc';
import type { CourseLegendRow } from '@/lib/gam/types';

/**
 * Fetch a course's legend rows. Pass the current viewer id so the RPC can
 * apply per-row champions_visibility filtering (see migration enforcing
 * privacy on get_course_legends). The RPC defaults p_viewer_id to auth.uid()
 * if omitted, so callers without a user are still safe.
 */
export function useCourseLegends(courseId: string | undefined, viewerId?: string | null) {
  return useGamRpc<CourseLegendRow[]>(
    'get_course_legends',
    courseId
      ? { p_course_id: courseId, p_viewer_id: viewerId ?? null }
      : ({} as { p_course_id: string; p_viewer_id: string | null }),
    { enabled: Boolean(courseId), staleTime: 60_000 },
  );
}
