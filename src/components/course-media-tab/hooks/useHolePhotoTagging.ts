/** Hole knowledge comes ONLY from the shared analysis hook at the tab caller.
 * This hook owns complete photo/tag reads and invalidates them after insertion.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import { fetchHolePhotos, fetchOwnPhotoSources, fetchOwnPhotoUrls, coursePhotoRounds, submitHolePhoto } from '@/lib/courseMedia/holePhotoData';

export function useHolePhotoTagging(courseId: string, memberId: string | undefined, knownHoles: readonly number[] | null) {
  const cache = useQueryClient();
  const enabled = !!memberId && knownHoles != null && knownHoles.length > 0;
  const tags = useQuery({ queryKey: ['hole-photo-tags', courseId, memberId], enabled,
    queryFn: () => memberId ? fetchHolePhotos(courseId, memberId) : Promise.resolve([]) });
  const own = useQuery({ queryKey: ['own-course-photo-urls', courseId, memberId], enabled,
    queryFn: () => memberId ? fetchOwnPhotoUrls(courseId, memberId) : Promise.resolve([]) });
  const sources = useQuery({ queryKey: ['own-course-photo-sources', courseId, memberId], enabled,
    queryFn: () => memberId ? fetchOwnPhotoSources(courseId, memberId) : Promise.resolve([]) });
  const rounds = useQuery({ queryKey: ['hole-photo-rounds', courseId, memberId], enabled,
    queryFn: () => memberId ? coursePhotoRounds(courseId, memberId) : Promise.resolve([]) });
  const submit = useMutation({
    mutationFn: ({ post, hole }: { post: FeedPost; hole: number }) => {
      if (!memberId || !knownHoles) throw new Error('This photograph cannot be tagged.');
      return submitHolePhoto(post, courseId, memberId, hole, knownHoles);
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId, memberId] });
    },
  });
  const taggedUrls = new Set((tags.data ?? []).filter(row => row.user_id === memberId).map(row => row.media_url));
  return { tags, own, sources, rounds, taggedUrls, submit, ready: enabled && tags.isSuccess && own.isSuccess };
}