import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AdminUntaggedMedia = Database['public']['Functions']['admin_get_untagged_course_media']['Returns'][number];
/** The caller enables this only for a server-confirmed admin with walk data. */
export function useAdminUntaggedCourseMedia(courseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['admin-untagged-course-media', courseId],
    enabled: enabled && !!courseId,
    queryFn: async (): Promise<AdminUntaggedMedia[]> => {
      const { data, error } = await supabase.rpc('admin_get_untagged_course_media', { p_course_id: courseId });
      if (error) throw error;
      return data ?? [];
    },
  });
}