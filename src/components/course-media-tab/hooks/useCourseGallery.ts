/** Course Media gallery data is built in the background once the Media tab's
 * tag reads settle (one warm useQuery, staleTime 60s), reading the existing
 * source to exhaustion while preserving Everything order. Hole reads run in
 * parallel with the media pages; tagged library shots join by canonical media
 * identity through Map lookups; hole attribution keeps get_hole_media
 * authority. A tap opens at once from the warm build, or from the page's own
 * known shots, then hydrates in place keeping the current shot. No new RPCs. */
import { useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useActiveActor } from '@/context/ActiveActorContext';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';
import type { RpcClient } from '@/features/watch-v2/hooks/useHubMixedGrid';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { holeMediaQuery } from '@/lib/courseMedia/holeMediaQuery';
import { holeShotsToFeedPosts, placeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { approvedTagsByKey, filteredGallery, galleryPost, galleryShots, type GalleryFilter, type GalleryShot } from '@/lib/courseMedia/courseGallery';
import { holeMediaKey, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { PlaceMedia } from './useCoursePlaceMedia';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface BuildArgs { courseId: string; courseName: string; userId: string; actorType?: string; actorId?: string; holeTags: readonly HolePhoto[]; placeTags: readonly PlaceMedia[] }
export const courseGalleryKey = (a: Pick<BuildArgs, 'courseId' | 'userId' | 'actorType' | 'actorId' | 'holeTags' | 'placeTags'>) =>
  ['course-gallery', a.courseId, a.userId, a.actorType, a.actorId,
    a.holeTags.filter(r => r.status === 'approved').map(r => r.id).join(','), a.placeTags.filter(r => r.status === 'approved').map(r => r.id).join(',')] as const;

export async function buildCourseGallery(cache: QueryClient, a: BuildArgs): Promise<GalleryShot[]> {
  const publicHoles = a.holeTags.filter(row => row.status === 'approved');
  const publicPlaces = a.placeTags.filter(row => row.status === 'approved');
  const numbers = [...new Set(publicHoles.map(row => row.hole_no))].sort((x, y) => x - y);
  const pages = (async () => {
    const flat: FeedPost[] = []; const seen = new Set<string>(); let cursor: string | undefined;
    for (;;) {
      const { data, error } = await (supabase as unknown as RpcClient).rpc('get_course_media_v2', { p_user_id: a.userId, p_course_id: a.courseId, p_filter: 'all', p_page_size: 30,
        p_seen_post_ids: [...seen], p_viewer_actor_type: a.actorType ?? 'personal', p_viewer_actor_id: a.actorId ?? a.userId, ...(cursor ? { p_cursor: cursor } : {}) });
      if (error) throw error;
      const rows = (data ?? []) as FeedRpcRow[];
      flat.push(...rows.map(mapRowToFeedPost));
      for (const row of rows) seen.add(row.post_id);
      const next = rows[rows.length - 1]?.post_created_at;
      if (rows.length < 30 || !next || next === cursor) break;
      cursor = next;
    }
    return flat;
  })();
  const holeReads = Promise.all(numbers.map(async n => holeShotsToFeedPosts(await cache.fetchQuery(holeMediaQuery(a.courseId, n)), a.courseName, a.courseId, n)));
  const placeRead = (async () => {
    if (!publicPlaces.length) return [] as FeedPost[];
    const ids = [...new Set(publicPlaces.map(row => row.user_id))];
    const profiles = await cache.fetchQuery({ queryKey: ['course-place-contributors', ids], queryFn: async () => {
      const { data, error } = await supabase.from('user_profiles').select('id, display_name, profile_photo_url').in('id', ids);
      if (error) throw error;
      return data ?? [];
    } });
    const members = new Map(profiles.map(row => [row.id, row]));
    return placeShotsToFeedPosts(publicPlaces.map(row => ({ ...row, member_id: row.user_id, member_name: members.get(row.user_id)?.display_name, member_avatar_url: members.get(row.user_id)?.profile_photo_url })), a.courseName, a.courseId, 'all', '');
  })();
  const [posts, holePosts, placePosts] = await Promise.all([pages, holeReads, placeRead]);
  const tags = new Map([...approvedTagsByKey(publicPlaces), ...approvedTagsByKey(publicHoles)].reverse());
  const taggedPosts = [...holePosts.flat(), ...placePosts].flatMap(post => post.mediaItems.map(item => {
    const tag = tags.get(holeMediaKey(item));
    return { ...post, id: item.id, userId: tag?.user_id ?? '', displayName: item.memberShot?.memberName ?? '', avatarUrl: item.memberShot?.avatarUrl ?? '', createdAt: tag?.added_at ?? '', mediaItems: [item] };
  }));
  const authority = new Map<string, FeedPost>();
  for (const post of taggedPosts) { const key = holeMediaKey(post.mediaItems[0]); if (!authority.has(key)) authority.set(key, post); }
  return galleryShots([...posts, ...taggedPosts], publicHoles, publicPlaces).map(shot => {
    const authoritative = authority.get(holeMediaKey(shot.item));
    return authoritative ? { ...shot, item: { ...shot.item, ...authoritative.mediaItems[0], id: shot.id }, ownerId: authoritative.userId, name: authoritative.displayName, avatar: authoritative.avatarUrl } : shot;
  });
}

/** Page-known shots: Everything posts already loaded, plus approved tag rows not among them. */
export function pageGalleryShots(posts: readonly FeedPost[], holeTags: readonly HolePhoto[], placeTags: readonly PlaceMedia[], courseId: string, courseName: string): GalleryShot[] {
  const known = new Set(posts.flatMap(post => post.mediaItems.map(item => holeMediaKey(item))));
  const extra: FeedPost[] = [...holeTags, ...placeTags].filter(row => row.status === 'approved').flatMap(row => {
    const item = { id: row.id, type: (row.media_type === 'video' ? 'video' : 'image') as 'video' | 'image', imageUrl: row.media_url, streamId: row.stream_id ?? undefined,
      thumbnailUrl: (row as { poster_url?: string | null }).poster_url ?? undefined, width: 0, height: 0 };
    const key = holeMediaKey(item);
    if (known.has(key)) return [];
    known.add(key);
    return [{ id: row.id, userId: row.user_id, actorId: row.user_id, actorType: 'personal', displayName: '', avatarUrl: '', username: '', isVerified: false, creatorRelation: 'none',
      caption: '', createdAt: row.added_at, courseId, courseName, mediaItems: [item], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false } as unknown as FeedPost];
  });
  return galleryShots([...posts, ...extra], holeTags, placeTags);
}

const findStart = (list: readonly GalleryShot[], startShotId?: string, holeNo?: number, startKey?: string) =>
  list.find(shot => shot.id === startShotId || shot.holeTag?.id === startShotId || shot.placeTag?.id === startShotId)
  ?? (startKey ? list.find(shot => holeMediaKey(shot.item) === startKey) : undefined)
  ?? (holeNo ? list.find(shot => shot.holeTag?.hole_no === holeNo) : undefined) ?? list[0];

export function useCourseGallery({ courseId, courseName, userId, holes, scored, holeTags, placeTags, pagePosts = [], tagsReady = true }: {
  courseId: string; courseName: string; userId?: string; holes: readonly CourseHole[]; scored: boolean;
  holeTags: readonly HolePhoto[]; placeTags: readonly PlaceMedia[]; pagePosts?: readonly FeedPost[]; tagsReady?: boolean;
}) {
  const cache = useQueryClient();
  const { activeActor } = useActiveActor();
  const opening = useRef(false);
  const args = useMemo(() => ({ courseId, courseName, userId: userId ?? '', actorType: activeActor?.type, actorId: activeActor?.id, holeTags, placeTags }),
    [courseId, courseName, userId, activeActor?.type, activeActor?.id, holeTags, placeTags]);
  const key = courseGalleryKey(args);
  const build = useQuery({ queryKey: key, enabled: !!userId && tagsReady, staleTime: 60_000, retry: false, queryFn: () => buildCourseGallery(cache, args) });
  const built = build.data;
  return useCallback(async (filter: GalleryFilter, startShotId: string | undefined, originEl: HTMLElement | null, entry: string, holeNo?: number) => {
    if (!userId || opening.current) return;
    opening.current = true;
    const open = (shots: GalleryShot[]) => {
      const data = { shots, holes, scored };
      const list = filteredGallery(shots, filter);
      const start = findStart(list, startShotId, holeNo);
      if (!start) return false;
      const options = { courseId, courseName, filter, startShotId: start.id };
      openWithOrigin({ posts: galleryPost(list, options), index: 0, originEl, mediaId: start.id, posterUrl: start.item.thumbnailUrl ?? start.item.imageUrl,
        openedFrom: 'course-media', options: { readOnly: true, syntheticPosts: true, courseGallery: options, galleryData: data } });
      opening.current = false;
      void analyticsEvents.track('course_gallery_open', { filter, entry });
      return true;
    };
    try {
      const warm = cache.getQueryData<GalleryShot[]>(key) ?? built;
      if (warm) { open(warm); return; }
      const opened = open(pageGalleryShots(pagePosts, holeTags, placeTags, courseId, courseName));
      const shots = await cache.fetchQuery({ queryKey: key, staleTime: 60_000, queryFn: () => buildCourseGallery(cache, args) });
      if (!opened) { open(shots); return; }
      const state = useFullscreenFeedStore.getState();
      const current = state.courseGallery;
      if (!state.isOpen || !current || current.courseId !== courseId || !state.galleryData) return;
      const shown = filteredGallery(state.galleryData.shots, current.filter);
      const now = shown[state.activePagerIdx] ?? shown[0];
      const list = filteredGallery(shots, current.filter);
      const keep = now ? findStart(list, now.id, now.holeTag?.hole_no, holeMediaKey(now.item)) : list[0];
      if (!keep) return;
      const next = { ...current, startShotId: keep.id };
      state.replaceGallery(galleryPost(list, next), next, { shots, holes, scored });
    } catch { /* Refused source/identity reads never invent a gallery. */ }
    finally { opening.current = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache, built, key.join('|'), args, courseId, courseName, userId, holes, scored, holeTags, placeTags, pagePosts]);
}
