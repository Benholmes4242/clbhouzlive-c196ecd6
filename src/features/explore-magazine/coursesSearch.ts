/**
 * A CHOSEN PLACE (country, optionally a region inside it).
 *
 * The search, the place tree and the place-to-course lookup that lived here
 * belonged to the Courses view, which is deleted. The type stays because the
 * Scores stream's documented rollback (placeScoped in ExploreMagazine) still
 * expresses a place in this vocabulary.
 */
export interface PlaceChoice {
  country: string;
  region: string | null;
}
