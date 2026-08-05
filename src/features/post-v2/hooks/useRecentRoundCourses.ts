// useRecentRoundCourses - courses the member has played most recently.
//
// Powers the suggestion-first "Tag a course" panel on composer page 2:
// tagging the course you just played should be one tap, with Search as the
// fallback rather than the entry point. Source is gam_round_stats (already
// denormalised with course_name), newest first, de-duplicated by course.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecentRoundCourse {
  id: string;
  name: string;
  country: string | null;
  playDate: string;
}

/** "Sunday" inside the last week, otherwise "18 Jul". */
export function formatRoundWhen(playDate: string, now: Date = new Date()): string {
  const [y, m, d] = playDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - then.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: 'long' });
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function useRecentRoundCourses(userId: string | null, limit = 3) {
  return useQuery({
    queryKey: ['recent-round-courses', userId, limit],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RecentRoundCourse[]> => {
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select('course_id, course_name, play_date')
        .eq('user_id', userId as string)
        .not('course_id', 'is', null)
        .order('play_date', { ascending: false })
        .limit(40);
      if (error) throw error;
      const seen = new Set<string>();
      const out: RecentRoundCourse[] = [];
      for (const r of (data ?? []) as Array<{ course_id: string | null; course_name: string | null; play_date: string }>) {
        const id = r.course_id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({
          id,
          name: r.course_name ?? 'Course',
          country: null,
          playDate: r.play_date,
        });
        if (out.length >= limit) break;
      }
      return out;
    },
  });
}
