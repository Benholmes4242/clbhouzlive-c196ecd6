/** Choose a Nominatim result for a club. Golf-course results win; otherwise
 * the first result counts only when it names the club's sub_country. Never
 * returns a guessed town centre. */
export interface NominatimPlace {
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  display_name?: string;
}

export function pickGolfResult(
  results: NominatimPlace[] | null | undefined,
  place: { sub_country?: string | null },
): { latitude: number; longitude: number } | null {
  if (!results || results.length === 0) return null;
  const toCoords = (r: NominatimPlace) => {
    const latitude = parseFloat(r.lat);
    const longitude = parseFloat(r.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  };
  const golf = results.find((r) => r.class === 'leisure' && r.type === 'golf_course');
  if (golf) return toCoords(golf);
  const sub = place.sub_country?.trim().toLowerCase();
  const first = results[0];
  if (sub && (first.display_name ?? '').toLowerCase().includes(sub)) return toCoords(first);
  return null;
}
