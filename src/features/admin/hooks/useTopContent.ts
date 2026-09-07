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
 * get_admin_top_content(p_days) RPC, which returns one row: top 5 posts by
 * likes + comments + shares, and top 5 courses by view count.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { stripMentionMarkup } from '@/lib/mentions/format';
import type { AnalyticsPeriod } from './useAnalytics';

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
      const { data, error } = await supabase.rpc('get_admin_top_content', {
        p_days: periodDays(period),
      });
      if (error) throw error;
      const payload = (data ?? {}) as {
        posts?: {
          id: string; likes: number; comments: number; shares: number; score: number;
          content_preview: string | null; author_name: string | null; created_at: string | null;
        }[];
        courses?: { id: string; name: string | null; views: number }[];
      };

      const posts: TopPost[] = (payload.posts ?? []).map(p => ({
        id: p.id,
        likes: Number(p.likes ?? 0),
        comments: Number(p.comments ?? 0),
        shares: Number(p.shares ?? 0),
        score: Number(p.score ?? 0),
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

      return { posts, courses };
    },
  });
}
