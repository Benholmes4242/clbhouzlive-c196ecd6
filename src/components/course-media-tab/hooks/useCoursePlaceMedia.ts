/** Place contributions are independent of hole contributions. Source ownership
 * is checked against the complete existing member-source read before insertion;
 * deletion removes only the caller's tag, never the underlying media. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { fetchOwnMediaSources, holeMediaKey, readAllPages, type OwnMediaSource } from '@/lib/courseMedia/holePhotoData';
import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';

export type PlaceMedia = Database['public']['Tables']['course_place_media']['Row'];
export const placeMediaKey = (courseId: string, memberId?: string) => ['course-place-media', courseId, memberId] as const;
export function fetchCoursePlaceMedia(courseId: string, memberId: string) {
  return readAllPages<PlaceMedia>((from, to) => supabase.from('course_place_media').select('*')
    .eq('course_id', courseId).or(`status.eq.approved,user_id.eq.${memberId}`)
    .order('added_at', { ascending: false }).order('id', { ascending: false }).range(from, to));
}
export async function submitCoursePlaceMedia(courseId: string, memberId: string, source: OwnMediaSource, place: CoursePlace): Promise<PlaceMedia> {
  if (!COURSE_PLACES.some(item => item.id === place)) throw new Error('Unknown place.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (auth.user?.id !== memberId) throw new Error('Please sign in again before tagging.');
  const sources = await fetchOwnMediaSources(courseId, memberId);
  const owned = sources.find(item => holeMediaKey(item) === holeMediaKey(source) && item.mediaType === source.mediaType);
  if (!owned) throw new Error('This shot is not yours at this course.');
  const { data, error } = await supabase.from('course_place_media').insert({
    course_id: courseId, user_id: memberId, place, status: 'approved',
    media_url: owned.url, media_type: owned.mediaType,
    file_name: new URL(owned.url).pathname.split('/').pop() || (owned.mediaType === 'video' ? 'video' : 'photo'),
    width: owned.width, height: owned.height, stream_id: owned.streamId,
    poster_url: owned.posterUrl, duration_seconds: owned.durationSeconds,
  }).select('*').single();
  if (error) throw error;
  return data;
}
export async function removeCoursePlaceMedia(row: PlaceMedia, memberId: string) {
  if (row.user_id !== memberId) throw new Error('This tag is not yours.');
  const { data, error } = await supabase.from('course_place_media').delete().eq('id', row.id).eq('user_id', memberId).select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('The tag was not removed.');
}
export function useCoursePlaceMedia(courseId: string, memberId?: string) {
  const cache = useQueryClient();
  const queryKey = placeMediaKey(courseId, memberId);
  const tags = useQuery({ queryKey, enabled: !!courseId && !!memberId,
    queryFn: () => memberId ? fetchCoursePlaceMedia(courseId, memberId) : Promise.resolve([]) });
  const invalidate = async () => {
    await Promise.all([cache.invalidateQueries({ queryKey }), cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId, memberId] })]);
  };
  const submit = useMutation({ mutationFn: ({ source, place }: { source: OwnMediaSource; place: CoursePlace }) => {
    if (!memberId) throw new Error('Please sign in before tagging.');
    return submitCoursePlaceMedia(courseId, memberId, source, place);
  }, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: ({ row }: { row: PlaceMedia }) => {
    if (!memberId) throw new Error('Please sign in before removing a tag.');
    return removeCoursePlaceMedia(row, memberId);
  }, onSuccess: invalidate });
  return { tags, submit, remove };
}