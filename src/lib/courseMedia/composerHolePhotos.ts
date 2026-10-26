/** COMPOSER_HOLES_1_R2/R3: optional enrichment belongs to the upload job, not
 * review attachment/retry. A failed contribution loses only its tag. Original
 * File capture dates are retained; chosen rounds are associations, not proof.
 * This module owns review-composer contribution writes because neither the
 * review-media attachment nor its retry registry may own optional enrichment.
 * MEDIA_TAGFIX_1: only original Files supply EXIF; an uploaded URL is never
 * fetched for metadata. Chosen round proof is independent of EXIF availability.
 * BRIEF_REVIEW_WIZARD_VIDEO_HOLE_TAGS: videos tag like photos, with empty EXIF
 * and the same chosen-round proof; a video without a stream id never writes.
 */
import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { readHolePhotoExif, type HolePhotoExif } from './holePhotoExif';
import { holePhotoVerdict } from './holePhotoVerdict';

export interface ComposerHoleJob {
  courseId: string;
  assignments: Readonly<Record<string, number>>;
  knownHoles: readonly number[];
  proofScoreId: string | null;
}

export const EMPTY_PHOTO_EXIF: HolePhotoExif = { capturedAt: null, captureDay: null, latitude: null, longitude: null };

export async function composerPhotoMetadata(file?: File, _url?: string): Promise<HolePhotoExif> {
  try {
    if (file) return await readHolePhotoExif(file);
  } catch { /* Missing/unreadable EXIF is ordinary and never blocks the review. */ }
  return { ...EMPTY_PHOTO_EXIF };
}

export async function composerPhotoVerdict(exif: HolePhotoExif, userId: string, courseId: string, proofScoreId: string | null) {
  return { ...holePhotoVerdict(exif, userId, courseId, []), proof_score_id: proofScoreId };
}

/** Caller invokes only after submit, when this item's uploaded URL exists.
 * No course_review_media id, source lookup, attach hold, toast or retry entry.
 */
export async function writeComposerHolePhoto(job: ComposerHoleJob | undefined, userId: string, item: { id: string; type: 'image' | 'video'; file?: File; streamId?: string | null; durationSeconds?: number | null; width?: number | null; height?: number | null; posterUrl?: string | null }, url: string): Promise<void> {
  const hole = job?.assignments[item.id];
  if (!job || hole == null || !job.knownHoles.includes(hole) || !url) return;
  const video = item.type === 'video';
  if (video && !item.streamId) return;
  try {
    const exif = video ? { ...EMPTY_PHOTO_EXIF } : await composerPhotoMetadata(item.file, url);
    const verdict = await composerPhotoVerdict(exif, userId, job.courseId, job.proofScoreId);
    // Photograph + owner is the duplicate key, never (course, hole, member).
    // A video also matches on its stream id, so a re-upload cannot double-tag.
    const streamId = video ? item.streamId ?? null : null;
    const base = supabase.from('course_hole_media').select('id')
      .eq('course_id', job.courseId).eq('user_id', userId);
    const read = streamId ? base.or(`media_url.eq.${url},stream_id.eq.${streamId}`) : base.eq('media_url', url);
    const { data: existing, error: readError } = await read.limit(1);
    if (readError || existing?.length) return;
    await supabase.from('course_hole_media').insert(video && streamId ? {
      course_id: job.courseId, hole_no: hole, user_id: userId,
      media_type: 'video', stream_id: streamId,
      media_url: generateStreamHlsUrl(streamId),
      poster_url: item.posterUrl ?? generateStreamThumbnailUrl(streamId),
      duration_seconds: item.durationSeconds ?? null,
      width: item.width ?? null, height: item.height ?? null,
      file_name: item.file?.name ?? null, ...verdict,
    } : {
      course_id: job.courseId, hole_no: hole, user_id: userId, media_url: url,
      file_name: item.file?.name ?? null, ...verdict,
    });
  } catch { /* Optional tag only: review publication and media remain untouched. */ }
}
