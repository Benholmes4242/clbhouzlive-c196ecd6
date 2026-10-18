/** MEDIA_ENGINE_1: isolated verdict only; no database writes or UI callers yet.
 * Round inputs must already have a real WHS-to-golf mapping and member identity.
 * Never confuse whs_scores.course_id (WHS) with the golf course UUID.
 * GPS is retained verbatim and never participates in verification.
 */
import type { HolePhotoExif } from './holePhotoExif';

export interface HolePhotoRound {
  id: string;
  userId: string;
  golfCourseId: string;
  playDate: string;
}

export function holePhotoVerdict(
  exif: HolePhotoExif,
  memberId: string,
  courseId: string,
  rounds: readonly HolePhotoRound[],
) {
  const match = exif.captureDay == null ? undefined : rounds.find(round =>
    round.userId === memberId && round.golfCourseId === courseId &&
    round.playDate.slice(0, 10) === exif.captureDay,
  );
  return {
    status: match ? 'approved' as const : 'pending' as const,
    auto_verdict: match ? 'published' as const : 'queued' as const,
    auto_confidence: match ? 1 : 0,
    auto_notes: match
      ? `Capture day ${exif.captureDay} matches your round ${match.id} at this course.`
      : exif.captureDay == null
        ? 'No EXIF capture date is present. Waiting for a human review.'
        : `No round of yours at this course matches capture day ${exif.captureDay}. Waiting for a human review.`,
    proof_score_id: match?.id ?? null,
    exif_captured_at: exif.capturedAt,
    exif_lat: exif.latitude,
    exif_lng: exif.longitude,
  };
}