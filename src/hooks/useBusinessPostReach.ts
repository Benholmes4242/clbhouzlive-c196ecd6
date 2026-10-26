/**
 * Insights section 4 "Your posts" (CB85).
 *
 * Reads `get_business_post_reach` (hand-applied INSIGHTS_POSTS_V1, not yet in
 * generated types). `posts` arrives in final order — reached posts most first
 * (ties to the newer post), then period posts that reached nobody — with the
 * team excluded server-side. The client never re-sorts or re-counts.
 * Previous-period data stays on screen while a new period loads.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PostReachRow {
  post_id: string;
  preview: string;
  created_at: string;
  reached: number;
  not_following: number;
  likes: number;
  comments: number;
}
export interface BusinessPostReach {
  period_days: number;
  posts: PostReachRow[];
  last_post: { post_id: string; created_at: string; reached: number } | null;
}

const num = (v: unknown) => Number(v) || 0;

export function parsePostReach(raw: any, days: number): BusinessPostReach {
  const p = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  const lp = p.last_post;
  return {
    period_days: num(p.period_days) || days,
    posts: Array.isArray(p.posts)
      ? p.posts.map((r: any) => ({
        post_id: String(r.post_id),
        preview: String(r.preview ?? ''),
        created_at: String(r.created_at ?? ''),
        reached: num(r.reached),
        not_following: num(r.not_following),
        likes: num(r.likes),
        comments: num(r.comments),
      }))
      : [],
    last_post: lp && lp.post_id
      ? { post_id: String(lp.post_id), created_at: String(lp.created_at ?? ''), reached: num(lp.reached) }
      : null,
  };
}

export function useBusinessPostReach(businessId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['business-post-reach', businessId, days],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BusinessPostReach> => {
      const { data, error } = await (supabase.rpc as any)('get_business_post_reach', {
        p_business_id: businessId,
        p_days: days,
      });
      if (error) throw error;
      return parsePostReach(data, days);
    },
  });
}
