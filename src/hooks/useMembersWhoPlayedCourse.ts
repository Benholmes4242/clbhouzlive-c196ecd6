import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * BRIEF_COURSE_TAB_REBUILD §3.7 (widened) — EVERYONE WHO HAS PLAYED HERE.
 *
 * useFriendsWhoPlayedCourse is friends-only AT THE SOURCE: it reads the follow
 * graph first and passes the resulting ids into `.in('user_id', ...)`, so it
 * cannot serve the wider set and returns [] the moment the viewer follows
 * nobody. This hook reads the same table WITHOUT that filter and then marks
 * which of the raters the viewer follows, so the circle can be named first
 * while the count is the true total.
 *
 * Same definition of "played here" as before — a rating on this course. No new
 * table, no new column, no SQL: the widening is a filter removal.
 *
 * Signed out, `course_ratings` is publicly readable but `user_profiles` is not,
 * so the total is trustworthy while names and faces come back empty. The
 * component handles that by rendering the count sentence alone.
 */
export interface CourseMember {
  user_id: string;
  in_circle: boolean;
  rated_at: string | null;
  profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

export interface CourseMembersResult {
  /** Everyone who has played here, circle first. */
  members: CourseMember[];
  /** Distinct raters, counted from rows even when profiles are unreadable. */
  total: number;
  /** How many of the total the viewer follows. */
  circleCount: number;
  /** False when signed out, or signed in following nobody. */
  hasCircle: boolean;
}

export function useMembersWhoPlayedCourse(courseId: string | undefined, viewerId?: string) {
  return useQuery<CourseMembersResult>({
    queryKey: ['members-who-played-course', courseId, viewerId ?? null],
    enabled: !!courseId,
    staleTime: 60_000,
    queryFn: async () => {
      const empty: CourseMembersResult = {
        members: [],
        total: 0,
        circleCount: 0,
        hasCircle: false,
      };
      if (!courseId) return empty;

      const { data: ratings, error } = await supabase
        .from('course_ratings')
        .select(
          `
          user_id,
          created_at,
          user_profiles!course_ratings_user_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `,
        )
        .eq('course_id', courseId);

      if (error) throw error;
      if (!ratings || ratings.length === 0) return empty;

      // The viewer's circle, read only when there is a viewer to have one.
      let circle = new Set<string>();
      if (viewerId) {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', viewerId);
        circle = new Set((follows || []).map((f: any) => f.following_id as string));
      }

      // One entry per member, keeping their earliest rating as the date.
      const byUser = new Map<string, CourseMember>();
      for (const row of ratings as any[]) {
        if (!row.user_id || row.user_id === viewerId) continue;
        const existing = byUser.get(row.user_id);
        if (existing) {
          if (row.created_at && existing.rated_at && row.created_at < existing.rated_at) {
            existing.rated_at = row.created_at;
          }
          continue;
        }
        byUser.set(row.user_id, {
          user_id: row.user_id,
          in_circle: circle.has(row.user_id),
          rated_at: row.created_at ?? null,
          profile: row.user_profiles ?? null,
        });
      }

      const members = Array.from(byUser.values()).sort((a, b) => {
        // Circle first, then most recently played.
        if (a.in_circle !== b.in_circle) return a.in_circle ? -1 : 1;
        return (b.rated_at ?? '').localeCompare(a.rated_at ?? '');
      });

      const circleCount = members.filter((m) => m.in_circle).length;

      return {
        members,
        total: members.length,
        circleCount,
        hasCircle: !!viewerId && circle.size > 0,
      };
    },
  });
}
