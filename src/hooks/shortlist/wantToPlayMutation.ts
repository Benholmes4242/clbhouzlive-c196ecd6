import { supabase } from '@/integrations/supabase/client';

/**
 * THE single want-to-play write path (BRIEF_DISCOVER_RELEVANCE B2).
 *
 * `useCoursePersonalStatus` (course page status toggle) and
 * `useWantToPlayToggle` (Discover cards) both call this — there is no second
 * insert/delete of course_shortlists anywhere in the shortlist flow.
 */
export async function setWantToPlayRequest(
  userId: string,
  courseId: string,
  want: boolean,
): Promise<void> {
  if (want) {
    // Remove any existing shortlist row first (one row per member/course).
    await supabase
      .from('course_shortlists')
      .delete()
      .eq('course_id', courseId)
      .eq('user_id', userId);

    const { error } = await supabase.from('course_shortlists').insert({
      user_id: userId,
      course_id: courseId,
      list_key: 'want_to_play',
    });
    // 23505 = already there; the desired end state is reached either way.
    if (error && error.code !== '23505') throw error;
    return;
  }

  const { error } = await supabase
    .from('course_shortlists')
    .delete()
    .eq('course_id', courseId)
    .eq('user_id', userId);
  if (error) throw error;
}
