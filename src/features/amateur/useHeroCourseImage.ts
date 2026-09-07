import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * THE HERO PHOTOGRAPH (BRIEF_AMATEUR_PAGE, block 0).
 *
 * useCircleLatestRounds carries no image column, so the hero was rendering the
 * fallback chain's gradient + initials — a monogram at 340px, which reads as an
 * error. The rest of the app (course rows in block 2, via get_board_courses)
 * uses golf_courses.thumbnail_image, so the hero reads THE SAME FIELD rather
 * than a hero/header column that is null on most records.
 */
export function useHeroCourseImage(courseId: string | null | undefined) {
  return useQuery({
    queryKey: ['amateur-hero-course-image', courseId],
    enabled: !!courseId,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('thumbnail_image')
        .eq('id', courseId!)
        .maybeSingle();
      if (error) {
        console.error('[useHeroCourseImage] lookup failed:', error);
        return null;
      }
      return (data?.thumbnail_image as string | null) ?? null;
    },
  });
}
