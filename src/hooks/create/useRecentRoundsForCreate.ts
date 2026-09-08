/**
 * useRecentRoundsForCreate — the rounds the create sheet opens on.
 *
 * ONE source per fact, and the WINDOW / RANK / CAP are all applied here, at
 * selection time, never in the render:
 *
 *   WINDOW  gam_round_stats, play_date within the last 14 days. The old
 *           unrated backlog belongs to the Rate nudge, not to this sheet.
 *   RANK    rounds with something outstanding (bare auto-post, or unrated
 *           course) first, recency inside each group; settled rounds only
 *           fill the slots left over.
 *   CAP     three. The sheet never grows and its list never scrolls.
 *
 * Post identity comes from posts.whs_score_id (the auto-posted round card).
 * A round with NO post carries no "Add photos" action — we never invent one.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileData } from '@/hooks/useProfileData';

export const CREATE_WINDOW_DAYS = 14;
export const CREATE_MAX_ROUNDS = 3;

export interface CreateSheetRound {
  whsScoreId: string;
  playDate: string;
  when: string;
  daysAgo: number;
  courseId: string | null;
  courseName: string;
  thumbnail: string | null;
  gross: number | null;
  toPar: string | null;
  /** The auto-posted round card, when it exists. */
  postId: string | null;
  postHasMedia: boolean;
  rated: boolean;
  yourRating: number | null;
}

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoOf(playDate: string, now: Date): number {
  const [y, m, d] = playDate.slice(0, 10).split('-').map(Number);
  const then = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - then.getTime()) / 86400000);
}

function whenLabel(playDate: string, days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const [y, m, d] = playDate.slice(0, 10).split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toParLabel(gross: number | null, par: number | null): string | null {
  if (gross == null || par == null) return null;
  const diff = gross - par;
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `\u2212${Math.abs(diff)}`;
}

export function useRecentRoundsForCreate(enabled = true) {
  const { profile } = useProfileData();
  const userId = profile?.id ?? null;

  return useQuery({
    queryKey: ['create-sheet-rounds', userId],
    enabled: enabled && !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<CreateSheetRound[]> => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - CREATE_WINDOW_DAYS);

      const { data: rows, error } = await supabase
        .from('gam_round_stats')
        .select('whs_score_id, play_date, course_id, course_name, gross_score, course_par')
        .eq('user_id', userId as string)
        .gte('play_date', localISO(from))
        .order('play_date', { ascending: false })
        .limit(60);
      if (error) throw error;
      const rounds = rows ?? [];
      if (rounds.length === 0) return [];

      const scoreIds = rounds.map((r) => r.whs_score_id as string).filter(Boolean);
      const courseIds = Array.from(
        new Set(rounds.map((r) => r.course_id as string | null).filter((v): v is string => !!v)),
      );

      const [postsRes, ratingsRes, coursesRes] = await Promise.all([
        scoreIds.length
          ? supabase.from('posts').select('id, whs_score_id').eq('user_id', userId as string).in('whs_score_id', scoreIds)
          : Promise.resolve({ data: [], error: null } as const),
        courseIds.length
          ? supabase.from('course_ratings').select('course_id, rating').eq('user_id', userId as string).in('course_id', courseIds)
          : Promise.resolve({ data: [], error: null } as const),
        courseIds.length
          ? supabase.from('golf_courses').select('id, name, thumbnail_image').in('id', courseIds)
          : Promise.resolve({ data: [], error: null } as const),
      ]);

      const postByScore = new Map<string, string>();
      for (const p of (postsRes.data ?? []) as Array<{ id: string; whs_score_id: string | null }>) {
        if (p.whs_score_id) postByScore.set(p.whs_score_id, p.id);
      }

      const postIds = Array.from(postByScore.values());
      const withMedia = new Set<string>();
      if (postIds.length) {
        const { data: media } = await supabase.from('post_media').select('post_id').in('post_id', postIds);
        for (const m of (media ?? []) as Array<{ post_id: string }>) withMedia.add(m.post_id);
      }

      const ratingByCourse = new Map<string, number | null>();
      for (const r of (ratingsRes.data ?? []) as Array<{ course_id: string; rating: number | null }>) {
        ratingByCourse.set(r.course_id, r.rating);
      }
      const courseById = new Map<string, { name: string | null; thumb: string | null }>();
      for (const c of (coursesRes.data ?? []) as Array<{ id: string; name: string | null; thumbnail_image: string | null }>) {
        courseById.set(c.id, { name: c.name, thumb: c.thumbnail_image });
      }

      const mapped: CreateSheetRound[] = rounds.map((r) => {
        const playDate = String(r.play_date);
        const days = daysAgoOf(playDate, now);
        const courseId = (r.course_id as string | null) ?? null;
        const course = courseId ? courseById.get(courseId) : undefined;
        const postId = postByScore.get(r.whs_score_id as string) ?? null;
        const rated = !!(courseId && ratingByCourse.has(courseId));
        return {
          whsScoreId: r.whs_score_id as string,
          playDate,
          when: whenLabel(playDate, days),
          daysAgo: days,
          courseId,
          courseName: course?.name || (r.course_name as string | null) || 'A course',
          thumbnail: course?.thumb ?? null,
          gross: (r.gross_score as number | null) ?? null,
          toPar: toParLabel((r.gross_score as number | null) ?? null, (r.course_par as number | null) ?? null),
          postId,
          postHasMedia: !!postId && withMedia.has(postId),
          rated,
          yourRating: rated && courseId ? (ratingByCourse.get(courseId) ?? null) : null,
        };
      });

      // RANK then CAP — here, not in the render.
      const outstanding = (r: CreateSheetRound) =>
        (r.postId && !r.postHasMedia ? 1 : 0) + (!r.rated ? 1 : 0);
      return mapped
        .filter((r) => r.daysAgo <= CREATE_WINDOW_DAYS)
        .sort((a, b) => {
          const oa = outstanding(a) > 0 ? 1 : 0;
          const ob = outstanding(b) > 0 ? 1 : 0;
          if (oa !== ob) return ob - oa;
          return a.daysAgo - b.daysAgo;
        })
        .slice(0, CREATE_MAX_ROUNDS);
    },
  });
}

export default useRecentRoundsForCreate;
