/** PF4: post_media owns holes and the server owns hole-page publication.
 * Only personal Everyone place tags use client course-place contributions.
 * Legacy URL hole rows are removed before updating an existing shot. */
import { supabase } from '@/integrations/supabase/client';
import { fetchOwnMediaSources, holeMediaKey, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { submitLibraryPlacePhoto, submitLibraryPlaceVideo } from '@/lib/courseMedia/libraryPlaceMedia';
import { submitCoursePlaceMedia, removeCoursePlaceMedia, type PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';
import { removeHoleTag } from '@/lib/courseMedia/removeHoleTag';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { isHoleTag, type ShotTag } from './golfPostRules';

/** One photo's choice: its tag and the course it was tagged against. */
export interface ShotTagChoice { tag: ShotTag; courseId: string; knownHoles: readonly number[] }
export interface ShotTagJob {
  /** Keyed by StageMediaItem.id. */
  items: Readonly<Record<string, ShotTagChoice>>;
  personal?: boolean;
  visibility?: string;
}

export interface SavedHoleTag { itemId: string; courseId: string; hole: number }
export async function writeShotTagAfterUpload(
  tagJob: ShotTagJob | undefined, memberId: string,
  item: { id: string; type: 'image' | 'video'; file?: File },
  uploaded: { url?: string; streamId?: string },
  onSavedHole?: (tag: SavedHoleTag) => void,
): Promise<void> {
  const choice = tagJob?.items[item.id];
  if (!choice || !item.file) return;
  const { tag } = choice;
  if (!isHoleTag(tag) && (tagJob?.personal === false || (tagJob?.visibility ?? 'anyone') !== 'anyone')) return;
  try {
    if (isHoleTag(tag)) {
      if (tagJob?.personal !== false && (tagJob?.visibility ?? 'anyone') === 'anyone') onSavedHole?.({ itemId: item.id, courseId: choice.courseId, hole: tag.hole });
      return;
    } else if (item.type === 'video') {
      if (uploaded.streamId) await submitLibraryPlaceVideo(item.file, uploaded.streamId, choice.courseId, memberId, tag.place);
    } else if (uploaded.url) await submitLibraryPlacePhoto(item.file, uploaded.url, choice.courseId, memberId, tag.place);
  } catch (err) { console.warn('[post-v2] shot tag write failed (tag only):', err); }
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

export function existingTagFor(url: string, tags: ExistingTags, mediaHole?: number | null): ShotTag | null {
  if (mediaHole != null) return { hole: mediaHole };
  const h = tags.holes.find((r) => r.media_url === url);
  if (h) return { hole: h.hole_no };
  const p = tags.places.find((r) => r.media_url === url);
  return p ? { place: p.place as never } : null;
}

/** Edit mode: an existing photo's tag changed. Remove the old, add the new. */
export async function rewriteExistingShotTag(
  courseId: string, memberId: string, knownHoles: readonly number[],
  item: { type: 'image' | 'video'; previewUrl: string; streamId?: string | null; existingId?: string },
  next: ShotTag | null, tags: ExistingTags, postUserId: string, personal = true, visibility = 'anyone',
): Promise<void> {
  const url = existingMediaUrl(item);
  try {
    for (const row of tags.holes.filter((r) => r.media_url === url)) await removeHoleTag(row, memberId);
    for (const row of tags.places.filter((r) => r.media_url === url)) await removeCoursePlaceMedia(row, memberId);
    if (item.existingId) {
      const { error } = await supabase.from('post_media').update({ hole_no: isHoleTag(next) ? next.hole : null, studio_edits: { shotTag: next ? { tag: next, courseId, knownHoles } : null } } as never).eq('id', item.existingId);
      if (error) throw error;
    }
    if (!next || isHoleTag(next) || !personal || visibility !== 'anyone') return;
    {
      const sources = await fetchOwnMediaSources(courseId, memberId);
      const key = holeMediaKey({ mediaType: item.type, url, streamId: item.streamId ?? null });
      const source = sources.find((s) => s.url === url || holeMediaKey(s) === key);
      if (source) await submitCoursePlaceMedia(courseId, memberId, source, next.place);
    }
  } catch (err) {
    throw err;
  }
}

/** All upload branches, including restored remote media, persist the shot's hole. */
export function shotMediaPatch(job: ShotTagJob | undefined, itemId: string): { hole_no: number | null } {
  const tag = job?.items[itemId]?.tag;
  return { hole_no: isHoleTag(tag) ? tag.hole : null };
}
