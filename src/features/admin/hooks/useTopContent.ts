import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsPeriod } from './useAnalytics';

// Props keys reused:
// - course_view props.course_id (verified in useCourseInsight.ts header)
// - post_like  props.post_id
// - post_share props.post_id
// - post_view  props.post_id (if fired). We do not depend on post_view here.

export interface TopPost {
  id: string;
  score: number;
  likes: number;
  comments: number;
  shares: number;
  contentPreview: string | null;
  authorName: string | null;
  createdAt: string | null;
}

export interface TopCourse {
  id: string;
  name: string | null;
  views: number;
}

function periodDays(period: AnalyticsPeriod): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
}

export function useTopContent(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin-v2', 'top-content', period],
    staleTime: 90_000,
    queryFn: async (): Promise<{ posts: TopPost[]; courses: TopCourse[] }> => {
      const days = periodDays(period);
      const since = new Date(Date.now() - days * 86_400_000).toISOString();

      // One bounded pull covering the three event names we need.
      const { data, error } = await supabase
        .from('analytics_events')
        .select('name, props')
        .in('name', ['course_view', 'post_like', 'post_share'])
        .gte('created_at', since)
        .limit(50000);
      if (error) throw error;

      const rows = (data ?? []) as { name: string; props: Record<string, unknown> | null }[];
      const likesByPost = new Map<string, number>();
      const sharesByPost = new Map<string, number>();
      const viewsByCourse = new Map<string, number>();
      for (const r of rows) {
        const pid = typeof r.props?.post_id === 'string' ? (r.props.post_id as string) : null;
        const cid = typeof r.props?.course_id === 'string' ? (r.props.course_id as string) : null;
        if (r.name === 'post_like' && pid) likesByPost.set(pid, (likesByPost.get(pid) ?? 0) + 1);
        else if (r.name === 'post_share' && pid) sharesByPost.set(pid, (sharesByPost.get(pid) ?? 0) + 1);
        else if (r.name === 'course_view' && cid) viewsByCourse.set(cid, (viewsByCourse.get(cid) ?? 0) + 1);
      }

      // Top 5 courses by view count.
      const topCourseIds = [...viewsByCourse.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const courseNames = new Map<string, string>();
      if (topCourseIds.length) {
        const { data: cd } = await supabase
          .from('golf_courses')
          .select('id, name')
          .in('id', topCourseIds.map(([id]) => id));
        for (const c of (cd ?? []) as { id: string; name: string }[]) courseNames.set(c.id, c.name);
      }
      const courses: TopCourse[] = topCourseIds.map(([id, views]) => ({
        id,
        name: courseNames.get(id) ?? null,
        views,
      }));

      // Candidate posts: union of like + share ids.
      const candidateIds = new Set<string>([...likesByPost.keys(), ...sharesByPost.keys()]);
      let posts: TopPost[] = [];
      if (candidateIds.size) {
        // Cap the candidate list before .in() so the payload stays small.
        const capped = [...candidateIds].slice(0, 200);
        const { data: pd } = await supabase
          .from('posts')
          .select('id, content, created_at, user_id, like_count, comment_count')
          .in('id', capped)
          .limit(200);
        const postRows = (pd ?? []) as {
          id: string; content: string | null; created_at: string; user_id: string;
          like_count: number | null; comment_count: number | null;
        }[];
        const authorIds = [...new Set(postRows.map(p => p.user_id))];
        const authorMap = new Map<string, string>();
        if (authorIds.length) {
          const { data: ad } = await supabase
            .from('user_profiles')
            .select('id, display_name, username')
            .in('id', authorIds);
          for (const a of (ad ?? []) as { id: string; display_name: string | null; username: string | null }[]) {
            authorMap.set(a.id, a.display_name ?? a.username ?? 'A member');
          }
        }
        posts = postRows.map(p => {
          const likes = p.like_count ?? 0;
          const comments = p.comment_count ?? 0;
          const shares = sharesByPost.get(p.id) ?? 0;
          return {
            id: p.id,
            likes,
            comments,
            shares,
            score: likes + comments + shares,
            contentPreview: (p.content ?? '').trim().slice(0, 140) || null,
            authorName: authorMap.get(p.user_id) ?? null,
            createdAt: p.created_at,
          };
        }).sort((a, b) => b.score - a.score).slice(0, 5);
      }

      return { posts, courses };
    },
  });
}
