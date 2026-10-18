/** COMPOSER_HOLES_1_R2/R3: optional enrichment belongs to the upload job, not
 * review attachment/retry. A failed contribution loses only its tag. Original
 * File EXIF is retained; chosen proof and EXIF proof are distinct mechanisms.
 */
import { supabase } from '@/integrations/supabase/client';
import { readHolePhotoExif, type HolePhotoExif } from './holePhotoExif';
import { matchedPhotoRounds, prepareHolePhoto } from './holePhotoData';
import { holePhotoVerdict } from './holePhotoVerdict';

export interface ComposerHoleJob {
  courseId: string;
  assignments: Readonly<Record<string, number>>;
  knownHoles: readonly number[];
  proofScoreId: string | null;
}

export const EMPTY_PHOTO_EXIF: HolePhotoExif = { capturedAt: null, captureDay: null, latitude: null, longitude: null };

export async function composerPhotoMetadata(file?: File, url?: string): Promise<HolePhotoExif> {
  try {
    if (file) return await readHolePhotoExif(file);
    if (url) return (await prepareHolePhoto(url)).exif;
  } catch { /* Missing/unreadable EXIF is ordinary and never blocks the review. */ }
  return { ...EMPTY_PHOTO_EXIF };
}

export async function composerPhotoVerdict(exif: HolePhotoExif, userId: string, courseId: string, proofScoreId: string | null) {
  const rounds = !proofScoreId && exif.captureDay ? await matchedPhotoRounds(courseId, userId, exif.captureDay) : [];
  const verdict = holePhotoVerdict(exif, userId, courseId, rounds);
  return proofScoreId ? {
    ...verdict, status: 'approved' as const, auto_verdict: 'published' as const,
    auto_confidence: 1, proof_score_id: proofScoreId,
    auto_notes: `Chosen round ${proofScoreId} at this course.`,
  } : verdict;
}

/** Caller invokes only after submit, when this item's uploaded URL exists.
 * No course_review_media id, source lookup, attach hold, toast or retry entry.
 */
export async function writeComposerHolePhoto(job: ComposerHoleJob | undefined, userId: string, item: { id: string; type: 'image' | 'video'; file?: File }, url: string): Promise<void> {
  const hole = job?.assignments[item.id];
  if (!job || item.type !== 'image' || hole == null || !job.knownHoles.includes(hole) || !url) return;
  try {
    const exif = await composerPhotoMetadata(item.file, url);
    const verdict = await composerPhotoVerdict(exif, userId, job.courseId, job.proofScoreId);
    // Photograph + owner is the duplicate key, never (course, hole, member).
    const { data: existing, error: readError } = await supabase.from('course_hole_media').select('id')
      .eq('course_id', job.courseId).eq('user_id', userId).eq('media_url', url).limit(1);
    if (readError || existing?.length) return;
    await supabase.from('course_hole_media').insert({
      course_id: job.courseId, hole_no: hole, user_id: userId, media_url: url,
      file_name: item.file?.name ?? null, ...verdict,
    });
  } catch { /* Optional tag only: review publication and media remain untouched. */ }
}

export function composerVerdictSentence(chosenDate: string | null, approved: boolean): string {
  if (chosenDate) return `From your round on ${chosenDate}, so it publishes straight away.`;
  return approved ? 'Taken on a day you played here, so it publishes straight away.'
    : 'A person will look before it goes on the hole. Your review posts now either way.';
}