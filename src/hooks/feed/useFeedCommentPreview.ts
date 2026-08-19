/**
 * useFeedCommentPreview — BATCHED newest-comment-per-post for feed cards.
 *
 * ONE read of comments_v2 per loaded feed page (plus one actor-resolution read),
 * never one per card. Call it where the feed's posts array lives (CardFeed /
 * LightCardFeed) and pass the resulting Map down.
 *
 * RULES BAKED IN HERE:
 *  - target_type = 'post' ALWAYS. comments_v2 is generic (posts, rounds,
 *    reviews); a round comment on a post card would be a data leak.
 *  - parent_id IS NULL ALWAYS. A reply is a reply to a comment, not a comment
 *    on the post, and must never be the preview.
 *  - The preview is the source of truth for what is DISPLAYED. If no comment
 *    comes back, callers render nothing — whatever comment_count claims.
 *  - A business comment resolves to the BUSINESS, not the member who typed it.
 */
import { useMemo, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { batchDigest, feedKeys, viewerId } from '@/lib/queryKeys';
import { useMergedBatch } from '@/lib/batchQuery';

export interface FeedCommentPreview {
  post_id: string;
  comment_id: string;
  content: string | null;
  created_at: string;
  actor_type: 'personal' | 'business';
  actor_id: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
  /** Parent comments counted in THIS page's read — used only for "view all n". */
  thread_count: number;
}

export type FeedCommentPreviewMap = Map<string, FeedCommentPreview>;

const EMPTY_MAP: FeedCommentPreviewMap = new Map();
/** Ceiling on rows pulled for a page. Busiest post in the data has ten. */
const ROW_CAP = 300;

type Row = {
  id: string;
  target_id: string;
  content: string | null;
  created_at: string;
  user_id: string | null;
  actor_type: string | null;
  actor_id: string | null;
};

export function useFeedCommentPreview(postIds: string[], scope: string) {
  const { user } = useSupabaseSession();
  const batch = useMergedBatch<FeedCommentPreview>();
  const seenRef = useRef<Set<string>>(new Set());

  const ids = useMemo(() => {
    const unique = Array.from(new Set(postIds.filter(Boolean)));
    unique.sort();
    return unique;
  }, [postIds]);

  const query = useQuery({
    queryKey: feedKeys.postCommentPreview(scope, viewerId(user?.id), batchDigest(ids)),
    placeholderData: keepPreviousData,
    enabled: ids.length > 0,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async (): Promise<FeedCommentPreviewMap> => {
      const { data, error } = await supabase
        .from('comments_v2')
        .select('id, target_id, content, created_at, user_id, actor_type, actor_id')
        .eq('target_type', 'post')
        .in('target_id', ids)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(ROW_CAP);
      if (error) throw error;

      const rows = (data ?? []) as Row[];
      // Newest per post (rows already sorted newest-first) + per-post tally.
      const newest = new Map<string, Row>();
      const counts = new Map<string, number>();
      for (const row of rows) {
        counts.set(row.target_id, (counts.get(row.target_id) ?? 0) + 1);
        if (!newest.has(row.target_id)) newest.set(row.target_id, row);
      }

      const picked = Array.from(newest.values());
      const personalIds = Array.from(new Set(
        picked.filter(r => (r.actor_type ?? 'personal') !== 'business')
          .map(r => r.actor_id ?? r.user_id).filter(Boolean) as string[],
      ));
      const businessIds = Array.from(new Set(
        picked.filter(r => r.actor_type === 'business')
          .map(r => r.actor_id).filter(Boolean) as string[],
      ));

      type ProfileRow = { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null };
      type BusinessRow = { id: string; name: string | null; logo_url: string | null; is_verified: boolean | null };
      const [profilesRes, businessRes] = await Promise.all([
        personalIds.length
          ? supabase.from('user_profiles').select('id, display_name, username, profile_photo_url').in('id', personalIds)
          : Promise.resolve({ data: [] as ProfileRow[] }),
        businessIds.length
          ? supabase.from('business_accounts').select('id, name, logo_url, is_verified').in('id', businessIds)
          : Promise.resolve({ data: [] as BusinessRow[] }),
      ]);
      const profileMap = new Map((profilesRes.data ?? []).map(p => [(p as ProfileRow).id, p as ProfileRow]));
      const businessMap = new Map((businessRes.data ?? []).map(b => [(b as BusinessRow).id, b as BusinessRow]));

      const map: FeedCommentPreviewMap = new Map();
      for (const row of picked) {
        const at = (row.actor_type ?? 'personal') === 'business' ? 'business' : 'personal';
        const aId = (row.actor_id ?? row.user_id) as string;
        if (!aId) continue;
        if (at === 'business') {
          const b = businessMap.get(aId);
          map.set(row.target_id, {
            post_id: row.target_id,
            comment_id: row.id,
            content: row.content,
            created_at: row.created_at,
            actor_type: 'business',
            actor_id: aId,
            display_name: b?.name ?? 'Business',
            avatar_url: b?.logo_url ?? null,
            verified: !!b?.is_verified,
            thread_count: counts.get(row.target_id) ?? 1,
          });
        } else {
          const p = profileMap.get(aId);
          map.set(row.target_id, {
            post_id: row.target_id,
            comment_id: row.id,
            content: row.content,
            created_at: row.created_at,
            actor_type: 'personal',
            actor_id: aId,
            display_name: p?.display_name ?? p?.username ?? 'Deleted user',
            avatar_url: p?.profile_photo_url ?? null,
            verified: false,
            thread_count: counts.get(row.target_id) ?? 1,
          });
        }
      }
      // Merge over previous so pagination never drops a resolved preview, but
      // record which posts this read covered so "has no comment" stays a real
      // answer rather than an absence of data.
      ids.forEach(id => seenRef.current.add(id));
      return batch.mergeOverPrevious(map);
    },
  });

  batch.commit(query.data);

  const map = query.data ?? EMPTY_MAP;
  const settledIds = seenRef.current;

  return {
    map,
    /** True once a read has covered this post id — gates the empty state. */
    isSettled: (postId: string) => settledIds.has(postId),
  };
}
