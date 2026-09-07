/**
 * TOP CONTENT — SERVER-SIDE (Batch 4, 7 Sep 2026).
 *
 * This hook used to pull raw analytics_events in the browser (course_view,
 * post_like, post_share) over a 7/30/90-day window and bucket them here.
 * PostgREST returns at most 2000 rows whatever `.limit()` says, and with no
 * ORDER BY the 2000 are physical order — the OLDEST slice of an append-only
 * table. At 90 days the window held ~2,828 rows, so the ranking was computed
 * from the oldest ~2000 and the newest content could not rank at all.
 *
 * Everything is now aggregated in Postgres behind the admin-gated
 * get_admin_top_content(p_days, p_include_staff) RPC, which returns one row:
 * top 5 posts by likes + comments + shares, and top 5 courses by view count.
 *
 * STAFF ARE EXCLUDED BY DEFAULT. Two staff accounts were ~74% of all events in
 * the 30-day window and 61% of course views were a single staff account, so a
 * view-ranked leaderboard with staff in it ranks what one person looked at, not
 * what members are drawn to. The "Include staff" toggle passes p_include_staff.
 *
 * SAMPLE FLOOR (EARLY_DATA_MIN_ROUNDS, 10). At this volume a rank is not a fact:
 * without staff, course views at positions two to six were 6, 6, 5, 4 and 3, and
 * one course reached the old top eight on ZERO member views. So every row
 * carries its own sample, rows under the floor carry the Early data chip, and if
 * fewer than three rows clear the floor the caller must state the window total
 * instead of drawing a leaderboard. `coursesOverFloor` / `postsOverFloor` count
 * ALL rows over the floor, not only the five returned.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { EARLY_DATA_MIN_ROUNDS } from '@/lib/earlyData';
import type { AnalyticsPeriod } from './useAnalytics';

/** Fewer than this many rows over the floor and no ranking may be drawn. */
export const MIN_RANKABLE_ROWS = 3;
export { EARLY_DATA_MIN_ROUNDS };

export interface TopPost {
  id: string;
  score: number;
  likes: number;
  comments: number;
  shares: number;
  /**
   * Engagement events measured INSIDE the window, staff-filtered. likes /
   * comments are all-time denormalised totals and cannot be filtered, so this
   * is the only figure the floor can honestly be tested against.
   */
  sample: number;
  contentPreview: string | null;
  authorName: string | null;
  createdAt: string | null;
}

export interface TopCourse {
  id: string;
  name: string | null;
  views: number;
}

export interface TopContentResult {
  posts: TopPost[];
  courses: TopCourse[];
  minSample: number;
  courseViewsTotal: number;
  coursesOverFloor: number;
  postEngagementsTotal: number;
  postsOverFloor: number;
}

function periodDays(period: AnalyticsPeriod): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
}

export function useTopContent(period: AnalyticsPeriod, includeStaff = false) {
  return useQuery({
    queryKey: ['admin-v2', 'top-content', period, includeStaff],
    staleTime: 90_000,
    queryFn: async (): Promise<TopContentResult> => {
      const { data, error } = await supabase.rpc('get_admin_top_content', {
        p_days: periodDays(period),
        p_include_staff: includeStaff,
        p_min_sample: EARLY_DATA_MIN_ROUNDS,
      } as never);
      if (error) throw error;
      const payload = (data ?? {}) as {
        posts?: {
          id: string; likes: number; comments: number; shares: number; score: number;
          sample: number;
          content_preview: string | null; author_name: string | null; created_at: string | null;
        }[];
        courses?: { id: string; name: string | null; views: number }[];
        min_sample?: number;
        course_views_total?: number;
        courses_over_floor?: number;
        post_engagements_total?: number;
        posts_over_floor?: number;
      };

      const posts: TopPost[] = (payload.posts ?? []).map(p => ({
        id: p.id,
        likes: Number(p.likes ?? 0),
        comments: Number(p.comments ?? 0),
        shares: Number(p.shares ?? 0),
        score: Number(p.score ?? 0),
        sample: Number(p.sample ?? 0),
        contentPreview:
          stripMentionMarkup((p.content_preview ?? '').trim()).trim().slice(0, 140) || null,
        authorName: p.author_name ?? null,
        createdAt: p.created_at ?? null,
      }));

      const courses: TopCourse[] = (payload.courses ?? []).map(c => ({
        id: c.id,
        name: c.name ?? null,
        views: Number(c.views ?? 0),
      }));

      return {
        posts,
        courses,
        minSample: Number(payload.min_sample ?? EARLY_DATA_MIN_ROUNDS),
        courseViewsTotal: Number(payload.course_views_total ?? 0),
        coursesOverFloor: Number(payload.courses_over_floor ?? 0),
        postEngagementsTotal: Number(payload.post_engagements_total ?? 0),
        postsOverFloor: Number(payload.posts_over_floor ?? 0),
      };
    },
  });
}
