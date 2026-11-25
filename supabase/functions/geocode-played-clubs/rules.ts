/** Pure work-list and write rules for geocode-played-clubs. */
export const RETRY_DAYS = 30;
export const MAX_PER_RUN = 40;

export interface ClubRow {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  sub_country: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_attempted_at: string | null;
}

export function isDue(club: ClubRow, now: Date): boolean {
  if (club.latitude !== null && club.longitude !== null) return false;
  if (!club.geocode_attempted_at) return true;
  const age = now.getTime() - new Date(club.geocode_attempted_at).getTime();
  return age > RETRY_DAYS * 86_400_000;
}

/** Most distinct members first, then oldest attempt (never-attempted first). */
export function buildWorkList(clubs: ClubRow[], members: Map<string, number>, now: Date): ClubRow[] {
  const ts = (c: ClubRow) => (c.geocode_attempted_at ? new Date(c.geocode_attempted_at).getTime() : -Infinity);
  return clubs
    .filter((c) => isDue(c, now))
    .sort((a, b) => (members.get(b.id) ?? 0) - (members.get(a.id) ?? 0) || ts(a) - ts(b));
}

export function buildQuery(club: ClubRow): string {
  return [club.name, club.sub_country, club.region, club.country].filter(Boolean).join(', ');
}

export type AttemptOutcome =
  | { kind: 'match'; latitude: number; longitude: number }
  | { kind: 'noMatch' }
  | { kind: 'httpError' };

/** Update payload for one attempt. Coordinates appear only on a match and the
 * caller applies them only where latitude is null; HTTP errors stamp nothing. */
export function updateFor(
  outcome: AttemptOutcome,
  nowIso: string,
): { coords: { latitude: number; longitude: number } | null; stamp: { geocode_attempted_at: string } } | null {
  if (outcome.kind === 'httpError') return null;
  return {
    coords: outcome.kind === 'match' ? { latitude: outcome.latitude, longitude: outcome.longitude } : null,
    stamp: { geocode_attempted_at: nowIso },
  };
}
