/** MEDIA_ENGINE_1_R2: read/write only the hole contribution; never mutate the
 * source photo. Analysis hook owns the hole list; this module has no resolver.
 * All complete-list reads paginate explicitly. Backend policies remain the
 * authority for moderation and owner-only rejected visibility.
 * MEDIA_TAGFIX_1: URL-only sources have no original File and no EXIF. Never
 * download media to manufacture a File; only library uploads parse originals.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { FeedPost } from '@/components/media-system/types/media';
import { readHolePhotoExif } from './holePhotoExif';
import { holePhotoVerdict, type HolePhotoRound } from './holePhotoVerdict';

export type HolePhoto = Database['public']['Tables']['course_hole_media']['Row'];
const PAGE = 500;
export async function readAllPages<T>(load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const result = await load(from, from + PAGE - 1);
    if (result.error) throw result.error;
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export function canTagHolePhoto(post: FeedPost, memberId: string | undefined, knownCount: number | null, taggedUrls: ReadonlySet<string>): boolean {
  const media = post.mediaItems[0];
  return knownCount != null && knownCount > 0 && !!memberId && post.userId === memberId &&
    post.actorType === 'personal' && media?.type === 'image' && !!media.imageUrl && !taggedUrls.has(media.imageUrl);
}

export async function fetchHolePhotos(courseId: string, memberId: string) {
  return readAllPages<HolePhoto>((from, to) => supabase.from('course_hole_media').select('*')
    .eq('course_id', courseId).or(`status.eq.approved,user_id.eq.${memberId}`).order('id').range(from, to));
}

/** Complete source counts, not length of the grid's loaded page. Mirrored review
 * images on posts use the same URL and count once, as a photograph does.
 */
export async function fetchOwnPhotoUrls(courseId: string, memberId: string): Promise<string[]> {
  return (await fetchOwnPhotoSources(courseId, memberId)).map(photo => photo.url);
}

export async function fetchOwnPhotoSources(courseId: string, memberId: string): Promise<{ url: string; createdAt: string }[]> {
  const [reviews, posts] = await Promise.all([
    readAllPages((from, to) => supabase.from('course_review_media')
      .select('id, media_url, created_at, course_ratings!inner(course_id,user_id)')
      .eq('course_ratings.course_id', courseId).eq('course_ratings.user_id', memberId)
      .eq('media_type', 'image').order('id').range(from, to)),
    readAllPages((from, to) => supabase.from('post_media')
      .select('id, media_url, created_at, posts!inner(user_id,course_id,tagged_course_ids,status,actor_type)')
      .eq('posts.user_id', memberId).eq('posts.status', 'published').eq('posts.actor_type', 'personal')
      .or(`course_id.eq.${courseId},tagged_course_ids.cs.{${courseId}}`, { referencedTable: 'posts' })
      .eq('media_type', 'image').order('id').range(from, to)),
  ]);
  return [...new Map([...reviews, ...posts].map(row => [row.media_url, { url: row.media_url, createdAt: row.created_at ?? '' }])).values()];
}

export async function prepareHolePhoto(_url: string) {
  return { exif: { capturedAt: null, captureDay: null, latitude: null, longitude: null } };
}

/** Chosen local File is uploaded by the existing authenticated media uploader;
 * insert uses original File EXIF, never metadata stripped by the uploaded URL.
 */
export async function submitLibraryHolePhoto(file: File, url: string, courseId: string, memberId: string, hole: number, knownHoles: readonly number[]): Promise<HolePhoto> {
  if (!knownHoles.includes(hole) || !file.type.startsWith('image/')) throw new Error('This photograph cannot be tagged.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (auth.user?.id !== memberId) throw new Error('Please sign in again before tagging.');
  // Metadata failure never blocks publication; URL-only inputs never parse.
  const exif = await readHolePhotoExif(file).catch(() => ({ capturedAt: null, captureDay: null, latitude: null, longitude: null }));
  const { data, error } = await supabase.from('course_hole_media').insert({ course_id: courseId, user_id: memberId, hole_no: hole, media_url: url, file_name: file.name, ...holePhotoVerdict(exif, memberId, courseId, []) }).select('*').single();
  if (error) throw error;
  return data;
}

export async function submitHolePhoto(post: FeedPost, courseId: string, memberId: string, hole: number, knownHoles: readonly number[]): Promise<HolePhoto> {
  const media = post.mediaItems[0];
  if (!knownHoles.includes(hole) || !canTagHolePhoto(post, memberId, knownHoles.length, new Set()) || !media?.imageUrl) {
    throw new Error('This photograph cannot be tagged.');
  }
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (auth.user?.id !== memberId) throw new Error('Please sign in again before tagging.');
  const [sourceUrls, existing] = await Promise.all([fetchOwnPhotoUrls(courseId, memberId), fetchHolePhotos(courseId, memberId)]);
  if (!sourceUrls.includes(media.imageUrl)) throw new Error('This photograph is not yours at this course.');
  if (existing.some(row => row.media_url === media.imageUrl && row.user_id === memberId)) throw new Error('This photograph is already tagged.');
  const name = new URL(media.imageUrl).pathname.split('/').pop() || 'photograph';
  const { exif } = await prepareHolePhoto(media.imageUrl);
  const verdict = holePhotoVerdict(exif, memberId, courseId, []);
  const { data, error } = await supabase.from('course_hole_media').insert({
    course_id: courseId, user_id: memberId, hole_no: hole, media_url: media.imageUrl,
    file_name: name, width: media.width || null, height: media.height || null, ...verdict,
  }).select('*').single();
  if (error) throw error;
  return data;
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen'];
export const spellPhotoCount = (count: number) => WORDS[count] ?? String(count);
export const capitalPhotoCount = (count: number) => { const word = spellPhotoCount(count); return word.charAt(0).toUpperCase() + word.slice(1); };
export function photoCoverage(knownHoles: readonly number[], rows: readonly HolePhoto[]) {
  const covered = new Set(rows.filter(row => row.status === 'approved').map(row => row.hole_no));
  return { known: knownHoles.length, unphotographed: knownHoles.filter(hole => !covered.has(hole)).length };
}