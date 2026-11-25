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
  town: string | null;
}

export const hasCoords = (c: Pick<ClubRow, 'latitude' | 'longitude'>) => c.latitude != null && c.longitude != null;

/** Missing coordinates, town, or region — region only where geo_regions has an
 * active row for the club's sub_country (USA states never qualify). */
export function needsWork(club: ClubRow, regionSubs: ReadonlySet<string> = new Set()): boolean {
  if (!hasCoords(club)) return true;
  if (club.town == null || club.town.trim() === '') return true;
  return club.region == null && !!club.sub_country && regionSubs.has(club.sub_country);
}

export function isDue(club: ClubRow, now: Date, regionSubs: ReadonlySet<string> = new Set()): boolean {
  if (!needsWork(club, regionSubs)) return false;
  if (!club.geocode_attempted_at) return true;
  const age = now.getTime() - new Date(club.geocode_attempted_at).getTime();
  return age > RETRY_DAYS * 86_400_000;
}

/** Missing coordinates first, then most distinct members, then oldest attempt (never-attempted first). */
export function buildWorkList(clubs: ClubRow[], members: Map<string, number>, now: Date, regionSubs: ReadonlySet<string> = new Set()): ClubRow[] {
  const ts = (c: ClubRow) => (c.geocode_attempted_at ? new Date(c.geocode_attempted_at).getTime() : -Infinity);
  return clubs
    .filter((c) => isDue(c, now, regionSubs))
    .sort((a, b) => Number(hasCoords(a)) - Number(hasCoords(b))
      || (members.get(b.id) ?? 0) - (members.get(a.id) ?? 0) || ts(a) - ts(b));
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

export const TIME_BUDGET_MS = 100_000;

/** True while another lookup may start: under the time budget and the per-run cap. */
export function shouldStartNext(elapsedMs: number, processed: number): boolean {
  return elapsedMs <= TIME_BUDGET_MS && processed < MAX_PER_RUN;
}

export const FAR_KM = 5;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Region/town may be filled only when the club had no coordinates before the
 * run, or the match lies within FAR_KM of them. */
export function withinGuard(club: Pick<ClubRow, 'latitude' | 'longitude'>, match: { lat: number; lng: number }): boolean {
  if (!hasCoords(club)) return true;
  return haversineKm({ lat: club.latitude!, lng: club.longitude! }, match) <= FAR_KM;
}

export interface RegionResolver {
  geoResolve: (raw: string, sub: string) => Promise<string | null>;
  alias: (raw: string, sub: string) => Promise<string | null>;
}

/** County first, then state; each via geo_resolve, then geo_region_aliases.
 * Null when the club already has a region or nothing resolves; never a raw value. */
export async function resolveRegion(
  club: Pick<ClubRow, 'region' | 'sub_country'>,
  match: { county: string | null; state: string | null },
  r: RegionResolver,
): Promise<string | null> {
  if (club.region != null || !club.sub_country) return null;
  for (const raw of [match.county, match.state]) {
    const v = raw?.trim();
    if (!v) continue;
    const viaRpc = (await r.geoResolve(v, club.sub_country))?.trim();
    if (viaRpc) return viaRpc;
    const viaAlias = (await r.alias(v, club.sub_country))?.trim();
    if (viaAlias) return viaAlias;
  }
  return null;
}
