/** Brief 35: every share-card photo resolves CORS-safely to a blob URL — direct CORS fetch first,
 * then the course-image-proxy edge function (thumbnail_image of that course only). A null result
 * makes the card draw the CourseImageFallback look in CSS, never a black panel. */
export interface SharePhotoCourse { position: number; course_id?: string | null; thumbnail_image?: string | null }

export const proxyUrlFor = (courseId: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/course-image-proxy?course_id=${encodeURIComponent(courseId)}`;

async function blobUrl(url: string, fetchImpl: typeof fetch): Promise<string> {
  const res = await fetchImpl(url, { mode: 'cors' });
  if (!res.ok) throw new Error(String(res.status));
  const blob = await res.blob();
  if (blob.type && !blob.type.startsWith('image/')) throw new Error('not an image');
  return URL.createObjectURL(blob);
}
const hostOf = (src: string) => { try { return new URL(src).hostname; } catch { return null; } };

export async function resolveSharePhoto(course: SharePhotoCourse, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const src = course.thumbnail_image;
  if (!src) return null;
  try { return await blobUrl(src, fetchImpl); } catch { /* fall through to the proxy */ }
  if (course.course_id) {
    try { return await blobUrl(proxyUrlFor(course.course_id), fetchImpl); } catch { /* fallback tile */ }
  }
  console.warn('[top10-share] photo failed', { position: course.position, host: hostOf(src) });
  return null;
}
