/** MEDIA_EMPTY_1: state selection uses photographs and available analysis only.
 * The no-photo catalogue count is an explicitly approved dated snapshot, not a
 * live query. Existing catalogue ownership supplies the total independently.
 */
import { REVIEWS_CATALOGUE_SNAPSHOT } from '@/lib/reviews/catalogueSnapshot';

export const MEDIA_EMPTY_SNAPSHOT = { withoutPhotos: 22_800, asOf: '2026-10-18' } as const;
export const MEDIA_CATALOGUE_TOTAL = REVIEWS_CATALOGUE_SNAPSHOT.total;
export function coursePhotoState(hasPhotographs: boolean, available: boolean) {
  return hasPhotographs ? available ? 'walk' : 'A' : available ? 'B' : 'C';
}