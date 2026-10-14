import { isFullEighteen, type ProfileRound } from '@/components/profile/rounds/useProfileRounds';

/**
 * ONE DEFINITION OF FORM (extracted unchanged from ProfileRoundsTab).
 *
 * Differential form: played-to (the stored handicap_differential) minus the
 * index the member held at the time. Par and course handicap are not part of
 * it. A round with no index on record has NO form value — the member's
 * current index is never substituted for the one they held.
 */
export function formValue(r: ProfileRound): number | null {
  if (!isFullEighteen(r) || r.handicap_differential == null || r.handicap_index_at_time == null) {
    return null;
  }
  return Number(r.handicap_differential) - Number(r.handicap_index_at_time);
}
