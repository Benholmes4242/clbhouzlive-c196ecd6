/** REVIEWS_STATE_1 — dated, explicitly authorised catalogue-copy exception.
 * Ben confirmed the total/rated pair on 2026-10-18. Never query the catalogue for this line
 * and never substitute the mock's invented figure. Only two figures are stored;
 * the no-review figure is always their difference. */
export const REVIEWS_CATALOGUE_SNAPSHOT = Object.freeze({
  asOf: '2026-10-18',
  total: 23_292,
  rated: 115,
});

export function reviewsCatalogueWithoutReview(): number {
  return REVIEWS_CATALOGUE_SNAPSHOT.total - REVIEWS_CATALOGUE_SNAPSHOT.rated;
}