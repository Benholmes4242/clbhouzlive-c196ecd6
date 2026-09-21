/**
 * useRecentCoursesForComposer — the three courses STEP 1 offers.
 *
 * This is a COURSE list, not a round list, and that is the whole difference
 * from the create sheet's hook. Step 1 asks WHICH COURSE, so a member who
 * played the same course three times last month must see it once, not three
 * times, and nothing about the round (post id, media state, outstanding
 * ranking) is of any use here.
 *
 *   WINDOW  90 days. At 14 — the create sheet's window — only 2 of 8 active
 *           members had anything to show, so the list was empty for the
 *           majority and the empty state was doing all the work.
 *   SHAPE   DISTINCT course_id from gam_round_stats, most recent play first.
 *   CAP     three. The list never scrolls.
 *
 * A round whose course does not resolve to golf_courses carries no id we can
 * rate, so it is dropped rather than shown as a row that cannot be picked.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileData } from '@/hooks/useProfileData';

export const COMPOSER_COURSE_WINDOW_DAYS = 90;
export const COMPOSER_MAX_COURSES = 3;

export interface ComposerRecentCourse {
  courseId: string;
  courseName: string;
  thumbnail: string | null;
  playDate: string;
  /** "Saturday" within the last week, otherwise "6 September". */
  when: string;
}

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function whenLabel(playDate: string, now: Date): string {
  const [y, m, d] = playDate.slice(0, 10).split('-').map(Number);
  const then = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - then.getTime()) / 86400000);
  if (days <= 6 && days >= 0) {
    return then.toLocaleDateString('en-GB', { weekday: 'long' });
  }
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

export function useRecentCoursesForComposer(enabled = true) {
  const { profile } = useProfileData();
  const userId = profile?.id ?? null;

  return useQuery({
    queryKey: ['composer-flow-recent-courses', userId],
    enabled: enabled && !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ComposerRecentCourse[]> => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - COMPOSER_COURSE_WINDOW_DAYS);

      const { data: rows, error } = await supabase
        .from('gam_round_stats')
        .select('play_date, course_id, course_name')
        .eq('user_id', userId as string)
        .not('course_id', 'is', null)
        .gte('play_date', localISO(from))
        .order('play_date', { ascending: false })
        .limit(200);
      if (error) throw error;

      // DISTINCT course, first sighting wins — the rows already arrive newest
      // first, so the first row for a course is its most recent play.
      const seen = new Set<string>();
      const picked: ComposerRecentCourse[] = [];
      for (const r of rows ?? []) {
        const id = (r as { course_id: string | null }).course_id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        picked.push({
          courseId: id,
          courseName: (r as { course_name: string | null }).course_name ?? '',
          thumbnail: null,
          playDate: (r as { play_date: string }).play_date,
          when: whenLabel((r as { play_date: string }).play_date, now),
        });
        if (picked.length >= COMPOSER_MAX_COURSES) break;
      }
      if (picked.length === 0) return [];

      // Name and image come from golf_courses, so the row reads the same as it
      // does everywhere else in the app rather than from the round's snapshot.
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image')
        .in('id', picked.map((p) => p.courseId));

      const byId = new Map(
        (courses ?? []).map((c) => [
          (c as { id: string }).id,
          c as { id: string; name: string | null; thumbnail_image: string | null },
        ]),
      );

      return picked
        .filter((p) => byId.has(p.courseId))
        .map((p) => {
          const c = byId.get(p.courseId)!;
          return {
            ...p,
            courseName: c.name ?? p.courseName,
            thumbnail: c.thumbnail_image ?? null,
          };
        });
    },
  });
}
