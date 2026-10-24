/** Hole knowledge comes ONLY from the shared analysis hook at the tab caller.
 * This hook owns complete photo/tag reads and invalidates them after insertion.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import { fetchHolePhotos, fetchOwnPhotoSources, fetchOwnPhotoUrls, holeMediaKey, submitHolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { retagHolePhoto } from '@/lib/courseMedia/retagHolePhoto';

export function useHolePhotoTagging(courseId: string, memberId: string | undefined, knownHoles: readonly number[] | null) {
  const cache = useQueryClient();
  const enabled = !!memberId && knownHoles != null && knownHoles.length > 0;
  // State D owner reads do not depend on analysis availability; writes still do.
  const tags = useQuery({ queryKey: ['hole-photo-tags', courseId, memberId], enabled: !!memberId && !!courseId,
    queryFn: () => memberId ? fetchHolePhotos(courseId, memberId) : Promise.resolve([]) });
  const own = useQuery({ queryKey: ['own-course-photo-urls', courseId, memberId], enabled,
    queryFn: () => memberId ? fetchOwnPhotoUrls(courseId, memberId) : Promise.resolve([]) });
  const sources = useQuery({ queryKey: ['own-course-photo-sources', courseId, memberId], enabled,
    queryFn: () => memberId ? fetchOwnPhotoSources(courseId, memberId) : Promise.resolve([]) });
  const submit = useMutation({
    mutationFn: ({ post, hole }: { post: FeedPost; hole: number }) => {
      if (!memberId || !knownHoles) throw new Error('This photograph cannot be tagged.');
      return submitHolePhoto(post, courseId, memberId, hole, knownHoles);
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId, memberId] });
    },
    onError: error => { console.error('[hole-tag] failed', error); },
  });
  // Raw canonical URLs plus stream-UID keys, so a feed video whose derived
  // playback URL differs from its stored media_url still reads as tagged.
  const taggedUrls = new Set<string>();
  for (const row of (tags.data ?? []).filter(row => row.user_id === memberId)) {
    taggedUrls.add(row.media_url);
    taggedUrls.add(holeMediaKey({ mediaType: row.media_type, url: row.media_url, streamId: row.stream_id }));
  }
  const retag = useMutation({
    mutationFn: ({ row, hole }: { row: HolePhoto; hole: number }) => {
      if (!memberId || !knownHoles) throw new Error('This photograph cannot be retagged.');
      return retagHolePhoto(row, hole, courseId, memberId, knownHoles);
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId, memberId] });
    },
    onError: error => { console.error('[hole-tag] failed', error); },
  });
  return { tags, own, sources, taggedUrls, submit, retag, ready: enabled && tags.isSuccess && own.isSuccess };
}