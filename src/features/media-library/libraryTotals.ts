/**
 * BRIEF_WATCH_SEE_ALL S1 — the LIBRARY totals behind Watch's four sections.
 *
 * Every figure here is a COUNT QUERY over the section's own source, never the
 * length of a rendered array: the Watch rails are fed by a 72-post cap, so a
 * count taken from what is loaded would repeat the fault the brief names.
 *
 * The count filters are exported so each destination page can run the SAME
 * predicate for its own total. That is what keeps the See all figure and the
 * page's own eyebrow the same number (S4.3).
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/** Reviews carrying at least one media item, prose-qualified as the rail is. */
export async function countReviewLibrary(): Promise<number> {
  const { count, error } = await supabase
    .from('course_ratings')
    .select('id, course_review_media!inner(id)', { count: 'exact', head: true })
    .eq('is_mock', false)
    .not('review', 'is', null);
  if (error) throw error;
  return count ?? 0;
}

/** Every published media item on a course-tagged post — the moments pool. */
export async function countMomentsLibrary(): Promise<number> {
  const { count, error } = await supabase
    .from('post_media')
    .select('id, posts!inner(id)', { count: 'exact', head: true })
    .eq('posts.status', 'published')
    .or('course_id.not.is.null,tagged_course_ids.neq.{}', { referencedTable: 'posts' });
  if (error) throw error;
  return count ?? 0;
}

export function useReviewLibraryTotal() {
  return useQuery({
    queryKey: ['library-total', 'reviews'],
    staleTime: 10 * 60_000,
    queryFn: countReviewLibrary,
  });
}

export function useMomentsLibraryTotal() {
  return useQuery({
    queryKey: ['library-total', 'moments'],
    staleTime: 10 * 60_000,
    queryFn: countMomentsLibrary,
  });
}
