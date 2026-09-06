import { useQuery } from '@tanstack/react-query';

import { useActiveActor } from '@/context/ActiveActorContext';
import { groupMultiMedia, mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';
import { supabase } from '@/integrations/supabase/client';
import type { RpcClient } from '@/features/watch-v2/hooks/useHubMixedGrid';

/**
 * BRIEF_GALLERY_TO_WATCH S3 — Watch's review tiles open the COURSE's media set,
 * not one review's. This reads the SAME source as the course detail page's media
 * tab (`get_course_media_v2`, filter `all`) and groups it with the SAME
 * `groupMultiMedia` pass, so the sequence a member sees from Watch is identical
 * to the one they see from the course page. Do NOT re-sort here.
 *
 * The only difference from the course tab is that Watch needs enough of the set
 * in one go to land on the tapped image, so it walks up to MAX_PAGES pages
 * eagerly instead of paginating on scroll.
 */

const PAGE_SIZE = 30;
const MAX_PAGES = 4;

export function useGalleryCourseMedia(courseId: string | null, userId: string | undefined) {
  const { activeActor } = useActiveActor();

  return useQuery({
    queryKey: ['gallery-course-media', courseId, userId, activeActor?.type, activeActor?.id],
    enabled: !!courseId && !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const flat: FeedPost[] = [];
      const seen: string[] = [];
      let cursor: string | undefined;

      for (let page = 0; page < MAX_PAGES; page += 1) {
        const params: Record<string, unknown> = {
          p_user_id: userId,
          p_course_id: courseId,
          p_filter: 'all',
          p_page_size: PAGE_SIZE,
          p_seen_post_ids: seen,
          p_viewer_actor_type: activeActor?.type ?? 'personal',
          p_viewer_actor_id: activeActor?.id ?? userId,
        };
        if (cursor) params.p_cursor = cursor;

        const { data, error } = await (supabase as unknown as RpcClient).rpc('get_course_media_v2', params);
        if (error) throw error;

        const rows = (data ?? []) as FeedRpcRow[];
        if (rows.length === 0) break;

        const posts = rows.map(mapRowToFeedPost);
        flat.push(...posts);
        for (const post of posts) {
          if (!seen.includes(post.id)) seen.push(post.id);
        }

        if (rows.length < PAGE_SIZE) break;
        cursor = rows[rows.length - 1].post_created_at;
        if (!cursor) break;
      }

      return groupMultiMedia(flat);
    },
  });
}
