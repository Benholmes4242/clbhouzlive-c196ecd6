/** Library uploads tagged straight to a place. Mirrors the hole library writes:
 * the caller uploads first (R2 for images, Stream for videos), then one
 * approved course_place_media row is inserted for the signed-in member. */
import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { COURSE_PLACES, type CoursePlace } from './places';
import { libraryHoleVideoError } from './holePhotoData';
import type { PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';

async function assertMember(memberId: string) {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (auth.user?.id !== memberId) throw new Error('Please sign in again before tagging.');
}
function assertPlace(place: CoursePlace) {
  if (!COURSE_PLACES.some(item => item.id === place)) throw new Error('Unknown place.');
}
/** Natural pixel size from the chosen File; null when the browser cannot decode it. */
export async function libraryImageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    if (typeof createImageBitmap !== 'function') return { width: null, height: null };
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return size;
  } catch { return { width: null, height: null }; }
}

export async function submitLibraryPlacePhoto(file: File, url: string, courseId: string, memberId: string, place: CoursePlace): Promise<PlaceMedia> {
  assertPlace(place);
  if (!file.type.startsWith('image/') || !url) throw new Error('This photograph cannot be tagged.');
  await assertMember(memberId);
  const { width, height } = await libraryImageSize(file);
  const { data, error } = await supabase.from('course_place_media').insert({
    course_id: courseId, user_id: memberId, place, status: 'approved',
    media_type: 'image', media_url: url, file_name: file.name, width, height,
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function submitLibraryPlaceVideo(file: File, streamId: string, courseId: string, memberId: string, place: CoursePlace): Promise<PlaceMedia> {
  assertPlace(place);
  const validationError = libraryHoleVideoError(file);
  if (validationError) throw new Error(validationError);
  if (!streamId) throw new Error('This video cannot be tagged.');
  await assertMember(memberId);
  const { data, error } = await supabase.from('course_place_media').insert({
    course_id: courseId, user_id: memberId, place, status: 'approved',
    media_type: 'video', stream_id: streamId, media_url: generateStreamHlsUrl(streamId),
    poster_url: generateStreamThumbnailUrl(streamId), duration_seconds: null, width: null, height: null,
    file_name: file.name,
  }).select('*').single();
  if (error) throw error;
  return data;
}
