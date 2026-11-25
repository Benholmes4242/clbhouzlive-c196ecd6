/** geocode-club logic with injected I/O (unit-testable). Response shapes are
 * the ones useCourseCoordinates already reads: {latitude, longitude, cached},
 * 404 for no club / no match, 502 for a geocoder failure. */
import type { GeocodeResult } from '../_shared/geocodeGolfClub.ts';

export interface ClubLookupRow { id: string; name: string; sub_country: string | null; latitude: number | null; longitude: number | null }

export interface GeocodeClubDeps {
  loadClub: (id: string) => Promise<ClubLookupRow | null>;
  geocode: (club: ClubLookupRow) => Promise<GeocodeResult>;
  /** Must only write where latitude and longitude are both null. */
  writeCoords: (id: string, coords: { latitude: number; longitude: number }) => Promise<unknown>;
}

export async function geocodeClub(clubId: string, d: GeocodeClubDeps): Promise<{ status: number; body: Record<string, unknown> }> {
  const club = await d.loadClub(clubId);
  if (!club) return { status: 404, body: { error: 'Club not found' } };
  if (club.latitude !== null && club.longitude !== null) {
    return { status: 200, body: { latitude: club.latitude, longitude: club.longitude, cached: true } };
  }
  const r = await d.geocode(club);
  if (r.kind === 'httpError' || r.kind === 'blocked') return { status: 502, body: { error: 'Geocoding service error' } };
  if (r.kind === 'noMatch') return { status: 404, body: { error: 'No geocoding match', latitude: null, longitude: null } };
  await d.writeCoords(club.id, { latitude: r.lat, longitude: r.lng });
  return { status: 200, body: { latitude: r.lat, longitude: r.lng, cached: false } };
}
