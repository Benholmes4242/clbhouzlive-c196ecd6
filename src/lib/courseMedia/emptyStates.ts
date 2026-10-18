/** MEDIA_EMPTY_1: state selection uses photographs and available analysis only.
 * The no-photo catalogue count is an explicitly approved dated snapshot, not a
 * live query. Existing catalogue ownership supplies the total independently.
 */
import { REVIEWS_CATALOGUE_SNAPSHOT } from '@/lib/reviews/catalogueSnapshot';
import type { HolePhoto } from './holePhotoData';

export const MEDIA_EMPTY_SNAPSHOT = { withoutPhotos: 22_800, asOf: '2026-10-18' } as const;
export const MEDIA_CATALOGUE_TOTAL = REVIEWS_CATALOGUE_SNAPSHOT.total;
export function coursePhotoState(hasPhotographs: boolean, available: boolean) {
  return hasPhotographs ? available ? 'walk' : 'A' : available ? 'B' : 'C';
}

/** MEDIA_EMPTY_1_R: the same exact owner population drives heading and rows.
 * Retag uses Ben's RPC; members never receive direct UPDATE permission.
 * Never expose reviewer text/identity/notes; unknown reasons use fixed fallback.
 */
export function privateHolePhotos(rows: readonly HolePhoto[], memberId: string, courseId: string) {
  return rows.filter(row => row.user_id === memberId && row.course_id === courseId && row.status === 'rejected');
}

/** Date-only display without local-time conversion; upload time is never used. */
export function photoDayLabel(value: string | null): string | null {
  const day = value?.slice(0, 10);
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}