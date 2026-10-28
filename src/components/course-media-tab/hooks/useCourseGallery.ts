/** Course Media gallery reads the existing source to exhaustion on opening,
 * preserving Everything order. Tagged library shots join by canonical media
 * identity; hole attribution keeps get_hole_media authority. No new RPCs. */
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveActor } from '@/context/ActiveActorContext';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';
import type { RpcClient } from '@/features/watch-v2/hooks/useHubMixedGrid';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { holeMediaQuery } from '@/lib/courseMedia/holeMediaQuery';
import { holeShotsToFeedPosts, placeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { filteredGallery, galleryPost, galleryShots, type GalleryFilter } from '@/lib/courseMedia/courseGallery';
import { holeMediaKey, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { PlaceMedia } from './useCoursePlaceMedia';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function useCourseGallery({ courseId, courseName, userId, holes, scored, holeTags, placeTags }: {
  courseId: string; courseName: string; userId?: string; holes: readonly CourseHole[]; scored: boolean;
  holeTags: readonly HolePhoto[]; placeTags: readonly PlaceMedia[];
}) {
  const cache = useQueryClient();
  const { activeActor } = useActiveActor();
  const opening = useRef(false);
  return useCallback(async (filter: GalleryFilter, startShotId: string | undefined, originEl: HTMLElement | null, entry: string, holeNo?: number) => {
    if (!userId || opening.current) return;
    opening.current = true;
    try {
      const posts = await cache.fetchQuery({ queryKey: ['course-gallery', courseId, userId, activeActor?.type, activeActor?.id], staleTime: 60_000, queryFn: async () => {
        const flat: FeedPost[] = []; const seen: string[] = []; let cursor: string | undefined;
        for (;;) {
          const { data, error } = await (supabase as unknown as RpcClient).rpc('get_course_media_v2', { p_user_id: userId, p_course_id: courseId, p_filter: 'all', p_page_size: 30,
            p_seen_post_ids: seen, p_viewer_actor_type: activeActor?.type ?? 'personal', p_viewer_actor_id: activeActor?.id ?? userId, ...(cursor ? { p_cursor: cursor } : {}) });
          if (error) throw error;
          const rows = (data ?? []) as FeedRpcRow[];
          flat.push(...rows.map(mapRowToFeedPost));
          for (const row of rows) if (!seen.includes(row.post_id)) seen.push(row.post_id);
          const next = rows[rows.length - 1]?.post_created_at;
          if (rows.length < 30 || !next || next === cursor) break;
          cursor = next;
        }
        return flat;
      } });
      const publicHoles = holeTags.filter(row => row.status === 'approved');
      const publicPlaces = placeTags.filter(row => row.status === 'approved');
      const numbers = [...new Set(publicHoles.map(row => row.hole_no))].sort((a,b) => a-b);
      const holePosts = (await Promise.all(numbers.map(async n => holeShotsToFeedPosts(await cache.fetchQuery(holeMediaQuery(courseId, n)), courseName, courseId, n)))).flat();
      let placePosts: FeedPost[] = [];
      if (publicPlaces.length) {
        const ids = [...new Set(publicPlaces.map(row => row.user_id))];
        const profiles = await cache.fetchQuery({ queryKey: ['course-place-contributors', ids], queryFn: async () => {
          const { data, error } = await supabase.from('user_profiles').select('id, display_name, profile_photo_url').in('id', ids);
          if (error) throw error;
          return data ?? [];
        } });
        const members = new Map(profiles.map(row => [row.id, row]));
        placePosts = placeShotsToFeedPosts(publicPlaces.map(row => ({ ...row, member_id: row.user_id, member_name: members.get(row.user_id)?.display_name, member_avatar_url: members.get(row.user_id)?.profile_photo_url })), courseName, courseId, 'all', '');
      }
      const taggedPosts = [...holePosts, ...placePosts].flatMap(post => post.mediaItems.map(item => {
        const key = holeMediaKey(item);
        const tag = [...publicHoles, ...publicPlaces].find(row => holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id }) === key);
        return { ...post, id: item.id, userId: tag?.user_id ?? '', displayName: item.memberShot?.memberName ?? '', avatarUrl: item.memberShot?.avatarUrl ?? '', createdAt: tag?.added_at ?? '', mediaItems: [item] };
      }));
      const data = { shots: galleryShots([...posts, ...taggedPosts], publicHoles, publicPlaces), holes, scored };
      const list = filteredGallery(data.shots, filter);
      const start = list.find(shot => shot.id === startShotId || shot.holeTag?.id === startShotId || shot.placeTag?.id === startShotId)
        ?? (holeNo ? list.find(shot => shot.holeTag?.hole_no === holeNo) : undefined) ?? list[0];
      if (!start) return;
      const options = { courseId, courseName, filter, startShotId: start.id };
      const mapped = galleryPost(list, options);
      openWithOrigin({ posts: mapped, index: 0, originEl, mediaId: start.id, posterUrl: start.item.thumbnailUrl ?? start.item.imageUrl,
        openedFrom: 'course-media', options: { readOnly: true, syntheticPosts: true, courseGallery: options, galleryData: data } });
      void analyticsEvents.track('course_gallery_open', { filter, entry });
    } catch { /* Refused source/identity reads never invent a gallery. */ }
    finally { opening.current = false; }
  }, [cache, courseId, courseName, userId, activeActor?.type, activeActor?.id, holes, scored, holeTags, placeTags]);
}