/** Hole viewer reads share the server's order and member identity through one
 * react-query key. Latest holes and HoleWalk must never use tag-table authors
 * as a fullscreen fallback: only get_hole_media supplies caption avatars. */
import { supabase } from '@/integrations/supabase/client';
import type { MemberShotRow } from './memberShotPosts';

export function holeMediaQuery(courseId: string, holeNo: number) {
  return {
    queryKey: ['hole-media', courseId, holeNo],
    staleTime: 60_000,
    queryFn: async (): Promise<MemberShotRow[]> => {
      // Server return shape advances independently of generated client types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_hole_media', {
        p_course_id: courseId, p_hole_no: holeNo,
      });
      if (error) throw error;
      return data ?? [];
    },
  };
}