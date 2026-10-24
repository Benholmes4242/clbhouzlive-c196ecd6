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
import { streamPosterFrom } from '@/utils/mediaThumbs';
import { buildHlsUrl } from '@/utils/streamId';

export interface OwnMediaSource {
  url: string; createdAt: string; mediaType: 'image' | 'video';
  streamId: string | null; posterUrl: string | null; durationSeconds: number | null;
  width: number | null; height: number | null;
}
export function holeMediaPoster(media: { media_url: string; media_type?: string; poster_url?: string | null; stream_id?: string | null }): string {
  return media.media_type === 'video' ? media.poster_url || streamPosterFrom(buildHlsUrl(media.stream_id || media.media_url) || media.media_url) || '' : media.media_url;
}
export const holeSourceUrl = (media: FeedPost['mediaItems'][number] | undefined) => media?.imageUrl || media?.hlsUrl || media?.mp4Url || '';

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
    post.actorType === 'personal' && (media?.type === 'image' || (media?.type === 'video' && !media.isProcessing)) && !!holeSourceUrl(media) && !taggedUrls.has(holeSourceUrl(media));
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

export async function fetchOwnMediaSources(courseId: string, memberId: string): Promise<OwnMediaSource[]> {
  const [reviews, posts] = await Promise.all([
    readAllPages((from, to) => supabase.from('course_review_media')
      .select('id, media_url, created_at, media_type, stream_id, poster_url, duration_seconds, width, height, status, course_ratings!inner(course_id,user_id)')
      .eq('course_ratings.course_id', courseId).eq('course_ratings.user_id', memberId)
      .order('id').range(from, to)),
    readAllPages((from, to) => supabase.from('post_media')
      .select('id, media_url, created_at, media_type, stream_id, poster_url, duration_seconds, width, height, processing_status, processing_error, posts!inner(user_id,course_id,tagged_course_ids,status,actor_type)')
      .eq('posts.user_id', memberId).eq('posts.status', 'published').eq('posts.actor_type', 'personal')
      .or(`course_id.eq.${courseId},tagged_course_ids.cs.{${courseId}}`, { referencedTable: 'posts' })
      .order('id').range(from, to)),
  ]);
  const readyReviews = reviews.filter(row => row.media_type !== 'video' || (row.duration_seconds != null && row.status !== 'failed'));
  const readyPosts = posts.filter(row => row.media_type !== 'video' || (row.duration_seconds != null && !['processing', 'pending', 'error'].includes(row.processing_status ?? '') && row.processing_error == null));
  return [...new Map([...readyReviews, ...readyPosts].filter(row => !row.media_type || ['image', 'video'].includes(row.media_type)).map(row => [row.media_url, {
    url: row.media_url, createdAt: row.created_at ?? '', mediaType: row.media_type === 'video' ? 'video' as const : 'image' as const,
    streamId: row.stream_id ?? null, posterUrl: row.media_type === 'video' ? holeMediaPoster(row) : row.poster_url ?? null,
    durationSeconds: row.duration_seconds ?? null, width: row.width ?? null, height: row.height ?? null,
  }])).values()];
}
export const fetchOwnPhotoSources = fetchOwnMediaSources;

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
  const url = holeSourceUrl(media);
  const kind = media?.type === 'video' ? 'video' : 'photo';
  if (!knownHoles.includes(hole) || !canTagHolePhoto(post, memberId, knownHoles.length, new Set()) || !media || !url) {
    throw new Error(`This ${kind} cannot be tagged.`);
  }
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (auth.user?.id !== memberId) throw new Error('Please sign in again before tagging.');
  const [sources, existing] = await Promise.all([fetchOwnMediaSources(courseId, memberId), fetchHolePhotos(courseId, memberId)]);
  const source = sources.find(item => item.url === url && item.mediaType === media.type);
  if (!source) throw new Error(`This ${kind} is not yours at this course.`);
  if (existing.some(row => row.media_url === url && row.user_id === memberId)) throw Object.assign(new Error(`That ${kind} is already tagged.`), { code: '23505' });
  const name = new URL(url).pathname.split('/').pop() || kind;
  const { exif } = await prepareHolePhoto(url);
  const verdict = holePhotoVerdict(exif, memberId, courseId, []);
  const { data, error } = await supabase.from('course_hole_media').insert({
    course_id: courseId, user_id: memberId, hole_no: hole, media_url: url,
    file_name: name, width: source.width || media.width || null, height: source.height || media.height || null,
    media_type: media.type,
    ...(media.type === 'video' ? { stream_id: source.streamId, poster_url: source.posterUrl, duration_seconds: source.durationSeconds } : {}), ...verdict,
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