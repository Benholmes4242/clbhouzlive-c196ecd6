import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LatestRating {
  rating: number;
  at: string;
  userId: string | null;
  actorName: string;
  actorAvatar: string | null;
}

/**
 * useCourseLatestRatings — the newest review per course inside the wire's
 * horizon, for the "rated this course" row on Around the world.
 *
 * The rater is NAMED (the anonymity rule is retired), so the rater's profile
 * name and photo are resolved in a second scoped read against the handful of
 * user ids the visible rows reference.
 *
 * Verified cheap: course_ratings is a small table and the read is scoped to the
 * course ids already grouped on screen, so no new query family is introduced.
 */
export function useCourseLatestRatings(courseIds: string[], windowDays = 90) {
  const key = Array.from(new Set(courseIds.filter(Boolean))).sort();
  return useQuery({
    queryKey: ['courseled', 'latest-ratings', windowDays, key.join('|')],
    queryFn: async (): Promise<Map<string, LatestRating>> => {
      const out = new Map<string, LatestRating>();
      if (key.length === 0) return out;
      const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating, created_at, user_id')
        .in('course_id', key)
        .eq('is_mock', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as Array<{
        course_id: string;
        rating: number;
        created_at: string;
        user_id: string | null;
      }>;
      for (const r of rows) {
        if (out.has(r.course_id)) continue;
        out.set(r.course_id, {
          rating: Number(r.rating),
          at: r.created_at,
          userId: r.user_id ?? null,
          actorName: '',
          actorAvatar: null,
        });
      }

      const userIds = Array.from(
        new Set([...out.values()].map((v) => v.userId).filter((id): id is string => !!id)),
      );
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', userIds);
        const byId = new Map(
          ((profiles ?? []) as Array<{
            id: string;
            display_name: string | null;
            username: string | null;
            profile_photo_url: string | null;
          }>).map((p) => [p.id, p]),
        );
        for (const v of out.values()) {
          const p = v.userId ? byId.get(v.userId) : undefined;
          if (!p) continue;
          v.actorName = (p.display_name ?? p.username ?? '').trim();
          v.actorAvatar = p.profile_photo_url ?? null;
        }
      }

      return out;
    },
    enabled: key.length > 0,
    staleTime: 15 * 60 * 1000,
  });
}
