/** Shared golf-club geocoder over Photon (photon.komoot.io, OpenStreetMap data,
 * ODbL: storage allowed with "© OpenStreetMap contributors" attribution).
 * Only leisure=golf_course features whose state/county/country equals the
 * club's sub_country count; never a town fallback. No Deno/npm imports so the
 * picker and the request wrapper are unit-testable. */
export interface PhotonFeature {
  geometry?: { coordinates?: [number, number] | number[] };
  properties?: { osm_key?: string; osm_value?: string; state?: string; county?: string; country?: string; name?: string };
}

export interface GolfClubPlace { name: string; sub_country?: string | null }

export type GeocodeResult =
  | { kind: 'match'; lat: number; lng: number }
  | { kind: 'noMatch' }
  | { kind: 'httpError'; status?: number; message?: string }
  | { kind: 'blocked'; status: number };

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

export function pickPhotonGolf(
  features: PhotonFeature[] | null | undefined,
  club: { sub_country?: string | null },
): { lat: number; lng: number } | null {
  const sub = norm(club.sub_country);
  if (!sub || !features) return null;
  for (const f of features) {
    const p = f.properties ?? {};
    if (p.osm_key !== 'leisure' || p.osm_value !== 'golf_course') continue;
    if (![p.state, p.county, p.country].some((v) => norm(v) === sub)) continue;
    const [lng, lat] = (f.geometry?.coordinates ?? []) as number[];
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

export function photonUrl(club: GolfClubPlace): string {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', [club.name, club.sub_country].filter(Boolean).join(' '));
  url.searchParams.set('osm_tag', 'leisure:golf_course');
  url.searchParams.set('limit', '5');
  url.searchParams.set('lang', 'en');
  return url.toString();
}

export const GEOCODE_TIMEOUT_MS = 8_000;

export async function geocodeGolfClub(
  club: GolfClubPlace,
  fetchFn: typeof fetch = fetch,
  timeoutMs: number = GEOCODE_TIMEOUT_MS,
): Promise<GeocodeResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('Timed out', 'TimeoutError')), timeoutMs);
  try {
    const res = await fetchFn(photonUrl(club), {
      headers: { 'User-Agent': 'clbhouz/1.0 (https://www.clbhouz.co.uk)' },
      signal: ctrl.signal,
    });
    if (res.status === 403 || res.status === 429) { await res.body?.cancel(); return { kind: 'blocked', status: res.status }; }
    if (!res.ok) { await res.body?.cancel(); return { kind: 'httpError', status: res.status }; }
    const body = (await res.json()) as { features?: PhotonFeature[] };
    const hit = pickPhotonGolf(body?.features, club);
    return hit ? { kind: 'match', ...hit } : { kind: 'noMatch' };
  } catch (err) {
    const e = err as Error;
    return { kind: 'httpError', message: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}` };
  } finally {
    clearTimeout(timer);
  }
}
