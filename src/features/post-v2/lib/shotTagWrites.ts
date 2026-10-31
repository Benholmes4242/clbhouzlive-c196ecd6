/** PER-PHOTO TAG WRITES for the post composer.
 *
 * A picked photo has no media_url until postUploadController finishes it, so
 * the chosen tag rides WITH the upload job (UploadJobContext.shotTags) and is
 * written by the controller the moment that item's upload completes. The
 * controller is module-level, so a tag survives the composer closing exactly
 * as the upload does.
 *
 * REUSED, NOT REBUILT: the writes are the course Media tab's library "add a
 * shot" path — submitLibraryHolePhoto / submitLibraryHoleVideo
 * (lib/courseMedia/holePhotoData.ts) and submitLibraryPlacePhoto /
 * submitLibraryPlaceVideo (lib/courseMedia/libraryPlaceMedia.ts) — with the
 * same trust model (published immediately). Existing post media (edit mode)
 * use the Media tab's own-source paths: submitHolePhoto, submitCoursePlaceMedia,
 * removeHoleTag and removeCoursePlaceMedia.
 *
 * A failed tag loses only the tag: it never fails the upload or the post.
 */
import { supabase } from '@/integrations/supabase/client';
import { submitLibraryHolePhoto, submitLibraryHoleVideo, submitHolePhoto, fetchOwnMediaSources, holeMediaKey, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { submitLibraryPlacePhoto, submitLibraryPlaceVideo } from '@/lib/courseMedia/libraryPlaceMedia';
import { submitCoursePlaceMedia, removeCoursePlaceMedia, type PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';
import { removeHoleTag } from '@/lib/courseMedia/removeHoleTag';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { FeedPost } from '@/components/media-system/types/media';
import { isHoleTag, type ShotTag } from './golfPostRules';

export interface ShotTagJob {
  courseId: string;
  knownHoles: readonly number[];
  /** Keyed by StageMediaItem.id. */
  tags: Readonly<Record<string, ShotTag>>;
}

export async function writeShotTagAfterUpload(
  job: ShotTagJob | undefined,
  memberId: string,
  item: { id: string; type: 'image' | 'video'; file?: File },
  uploaded: { url?: string; streamId?: string },
): Promise<void> {
  const tag = job?.tags[item.id];
  if (!job || !tag || !item.file) return;
  try {
    if (isHoleTag(tag)) {
      if (item.type === 'video') {
        if (uploaded.streamId) await submitLibraryHoleVideo(item.file, uploaded.streamId, job.courseId, memberId, tag.hole, job.knownHoles);
      } else if (uploaded.url) {
        await submitLibraryHolePhoto(item.file, uploaded.url, job.courseId, memberId, tag.hole, job.knownHoles);
      }
    } else if (item.type === 'video') {
      if (uploaded.streamId) await submitLibraryPlaceVideo(item.file, uploaded.streamId, job.courseId, memberId, tag.place);
    } else if (uploaded.url) {
      await submitLibraryPlacePhoto(item.file, uploaded.url, job.courseId, memberId, tag.place);
    }
  } catch (err) {
    console.warn('[post-v2] shot tag write failed (tag only):', err);
  }
}

/** Existing post media key: the url the Media tab stores for it. */
export const existingMediaUrl = (m: { type: 'image' | 'video'; previewUrl: string; streamId?: string | null }) =>
  m.type === 'video' && m.streamId ? generateStreamHlsUrl(m.streamId) : m.previewUrl;

export interface ExistingTags { holes: HolePhoto[]; places: PlaceMedia[] }

/** The member's own tags on these urls, for edit-mode hydration. */
export async function readExistingShotTags(courseId: string, memberId: string, urls: readonly string[]): Promise<ExistingTags> {
  if (!urls.length) return { holes: [], places: [] };
  const [holes, places] = await Promise.all([
    supabase.from('course_hole_media').select('*').eq('course_id', courseId).eq('user_id', memberId).in('media_url', urls as string[]),
    supabase.from('course_place_media').select('*').eq('course_id', courseId).eq('user_id', memberId).in('media_url', urls as string[]),
  ]);
  return { holes: (holes.data ?? []) as HolePhoto[], places: (places.data ?? []) as PlaceMedia[] };
}

export function existingTagFor(url: string, tags: ExistingTags): ShotTag | null {
  const h = tags.holes.find((r) => r.media_url === url);
  if (h) return { hole: h.hole_no };
  const p = tags.places.find((r) => r.media_url === url);
  return p ? { place: p.place as never } : null;
}

/** Edit mode: an existing photo's tag changed. Remove the old, add the new. */
export async function rewriteExistingShotTag(
  courseId: string, memberId: string, knownHoles: readonly number[],
  item: { type: 'image' | 'video'; previewUrl: string; streamId?: string | null },
  next: ShotTag | null, tags: ExistingTags, postUserId: string,
): Promise<void> {
  const url = existingMediaUrl(item);
  try {
    for (const row of tags.holes.filter((r) => r.media_url === url)) await removeHoleTag(row, memberId);
    for (const row of tags.places.filter((r) => r.media_url === url)) await removeCoursePlaceMedia(row, memberId);
    if (!next) return;
    if (isHoleTag(next)) {
      const post = {
        userId: postUserId, actorType: 'personal',
        mediaItems: [item.type === 'video'
          ? { id: url, type: 'video', hlsUrl: url, streamId: item.streamId ?? undefined, width: 0, height: 0 }
          : { id: url, type: 'image', imageUrl: url, width: 0, height: 0 }],
      } as unknown as FeedPost;
      await submitHolePhoto(post, courseId, memberId, next.hole, knownHoles);
    } else {
      const sources = await fetchOwnMediaSources(courseId, memberId);
      const key = holeMediaKey({ mediaType: item.type, url, streamId: item.streamId ?? null });
      const source = sources.find((s) => s.url === url || holeMediaKey(s) === key);
      if (source) await submitCoursePlaceMedia(courseId, memberId, source, next.place);
    }
  } catch (err) {
    console.warn('[post-v2] existing shot tag rewrite failed (tag only):', err);
  }
}
