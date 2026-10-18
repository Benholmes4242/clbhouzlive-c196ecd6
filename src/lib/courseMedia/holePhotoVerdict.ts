/** MEDIA_TRUST_1_R3: publication payload, never a verification gate.
 * Original File capture dates serve season chips only. GPS is not persisted.
 * Legacy arguments are inert; only an explicit composer association sets proof.
 */
import type { HolePhotoExif } from './holePhotoExif';

export interface HolePhotoRound {
  id: string;
  userId: string;
  golfCourseId: string;
  playDate: string;
  /** Display-only existing gam_round_stats gross; never influences verdict. */
  grossScore?: number | null;
}

export function holePhotoVerdict(
  exif: HolePhotoExif,
  _memberId: string,
  _courseId: string,
  _rounds: readonly HolePhotoRound[],
) {
  return {
    status: 'approved' as const,
    proof_score_id: null,
    exif_captured_at: exif.capturedAt,
  };
}