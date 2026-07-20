import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { stripMentionMarkup } from '@/lib/mentions/format';

// Props keys verified against callsites:
// - post_like: src/components/clubhouse/hooks/useClubhouseLikes.ts L52 => { post_id, action }.
// - post_share: src/components/clubhouse/hooks/useClubhouseShare.ts L16 => { post_id }.
// posts.like_count and posts.comment_count are maintained counters on the
// posts table (see supabase types). We use those for headline stats because
// they are cheaper and authoritative for the current total.
// No `post_comment` analytics_events exists, so the 14-day sparkline includes
// only likes and shares; comments show the current total only.

export interface PostInsight {
  authorId: string | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
  createdAt: string | null;
  contentPreview: string | null;
  mediaLabel: string | null;
  likes: number;
  comments: number;
  shares: number;
  daily14d: { date: string; likes: number; shares: number }[];
}

const DAY_MS = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function usePostInsight(postId: string | null) {
  return useQuery({
    queryKey: ['admin-v2', 'post-insight', postId],
    enabled: !!postId,
    staleTime: 45_000,
    queryFn: async (): Promise<PostInsight> => {
      const now = new Date();
      const since14d = new Date(now.getTime() - 14 * DAY_MS).toISOString();

      const [postRes, likesRes, sharesRes] = await Promise.all([
        supabase
          .from('posts')
          .select('id, content, created_at, user_id, like_count, comment_count')
          .eq('id', postId!)
          .maybeSingle(),
        supabase
          .from('analytics_events')
          .select('created_at')
          .eq('name', 'post_like')
          .contains('props', { post_id: postId })
          .gte('created_at', since14d)
          .limit(20000),
        supabase
          .from('analytics_events')
          .select('created_at')
          .eq('name', 'post_share')
          .contains('props', { post_id: postId })
          .gte('created_at', since14d)
          .limit(20000),
      ]);

      const post = postRes.data as {
        id: string;
        content: string | null;
        created_at: string;
        user_id: string;
        like_count: number | null;
        comment_count: number | null;
      } | null;

      let authorName: string | null = null;
      let authorAvatarUrl: string | null = null;
      let mediaLabel: string | null = null;

      if (post?.user_id) {
        const profRes = await supabase
          .from('user_profiles')
          .select('display_name, username, profile_photo_url')
          .eq('id', post.user_id)
          .maybeSingle();
        const p = profRes.data as { display_name: string | null; username: string | null; profile_photo_url: string | null } | null;
        authorName = p?.display_name ?? p?.username ?? null;
        authorAvatarUrl = p?.profile_photo_url ?? null;
      }
      if (post && !(post.content ?? '').trim()) {
        const mediaRes = await supabase
          .from('post_media')
          .select('media_type')
          .eq('post_id', post.id)
          .limit(1);
        const mt = (mediaRes.data?.[0] as { media_type: string } | undefined)?.media_type;
        if (mt === 'video') mediaLabel = 'Video post';
        else if (mt === 'image' || mt === 'photo') mediaLabel = 'Photo post';
      }

      // 14-day sparkline buckets
      const dayBuckets = new Map<string, { likes: number; shares: number }>();
      for (let i = 13; i >= 0; i--) {
        dayBuckets.set(isoDay(new Date(now.getTime() - i * DAY_MS)), { likes: 0, shares: 0 });
      }
      for (const r of (likesRes.data ?? []) as { created_at: string }[]) {
        const b = dayBuckets.get(r.created_at.slice(0, 10));
        if (b) b.likes += 1;
      }
      for (const r of (sharesRes.data ?? []) as { created_at: string }[]) {
        const b = dayBuckets.get(r.created_at.slice(0, 10));
        if (b) b.shares += 1;
      }

      // Prefer analytics_events count over 14d window? No - use posts.* totals
      // for headline stats to reflect all-time. Shares total from events is
      // an approximation over 14d; label accordingly in the UI.
      return {
        authorId: post?.user_id ?? null,
        authorName,
        authorAvatarUrl,
        createdAt: post?.created_at ?? null,
        contentPreview: stripMentionMarkup((post?.content ?? '').trim()).trim().slice(0, 220) || null,
        mediaLabel,
        likes: post?.like_count ?? 0,
        comments: post?.comment_count ?? 0,
        shares: (sharesRes.data ?? []).length,
        daily14d: Array.from(dayBuckets.entries()).map(([date, v]) => ({ date, likes: v.likes, shares: v.shares })),
      };
    },
  });
}
