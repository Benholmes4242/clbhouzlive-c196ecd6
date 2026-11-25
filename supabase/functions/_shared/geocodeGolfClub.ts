/** Shared golf-club geocoder over Geoapify (OpenStreetMap data; keyed free plan
 * permits storing results, credit link required on the website). The golf
 * signal is the result NAME: only results named "golf" whose state/county/
 * country equals the club's sub_country count; never a town fallback. No
 * Deno/npm imports so the picker and the request wrapper are unit-testable. */
export interface GeoapifyResult {
  name?: string | null; state?: string | null; county?: string | null; city?: string | null;
  country?: string | null; result_type?: string | null; lat?: number | string | null; lon?: number | string | null;
}

export interface GolfClubPlace { name: string; sub_country?: string | null }

export interface GolfMatch { lat: number; lng: number; county: string | null; state: string | null; city: string | null }

export type GeocodeResult =
  | ({ kind: 'match' } & GolfMatch)
  | { kind: 'noMatch' }
  | { kind: 'httpError'; status?: number; message?: string }
  | { kind: 'blocked'; status: number };

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

export function pickGeoapifyGolf(
  results: GeoapifyResult[] | null | undefined,
  club: { name?: string | null; sub_country?: string | null },
): GolfMatch | null {
  const sub = norm(club.sub_country);
  if (!sub || !results) return null;
  const candidates = results.filter((r) =>
    norm(r.name).includes('golf') && [r.state, r.county, r.country].some((v) => norm(v) === sub));
  const want = norm(club.name);
  const ordered = [...candidates.filter((r) => want && norm(r.name) === want), ...candidates];
  for (const r of ordered) {
    const lat = Number(r.lat), lng = Number(r.lon);
    if (r.lat == null || r.lon == null || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    return { lat, lng, county: r.county ?? null, state: r.state ?? null, city: r.city ?? null };
  }
  return null;
}

export function geoapifyUrl(club: GolfClubPlace, apiKey: string): string {
  const params = new URLSearchParams({
    text: `${club.name}, ${club.sub_country ?? ''}`, format: 'json', limit: '5', lang: 'en', apiKey,
  });
  return `https://api.geoapify.com/v1/geocode/search?${params.toString()}`;
}

export const GEOCODE_TIMEOUT_MS = 8_000;

const envKey = (): string | undefined => {
  try { return (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get('GEOAPIFY_API_KEY'); }
  catch { return undefined; }
};

export async function geocodeGolfClub(
  club: GolfClubPlace,
  fetchFn: typeof fetch = fetch,
  timeoutMs: number = GEOCODE_TIMEOUT_MS,
  apiKey: string | undefined = envKey(),
): Promise<GeocodeResult> {
  if (!apiKey) return { kind: 'httpError', message: 'GEOAPIFY_API_KEY not set' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('Timed out', 'TimeoutError')), timeoutMs);
  try {
    const res = await fetchFn(geoapifyUrl(club, apiKey), {
      headers: { 'User-Agent': 'clbhouz/1.0 (https://www.clbhouz.co.uk)' },
      signal: ctrl.signal,
    });
    if (res.status === 401 || res.status === 403 || res.status === 429) { await res.body?.cancel(); return { kind: 'blocked', status: res.status }; }
    if (!res.ok) { await res.body?.cancel(); return { kind: 'httpError', status: res.status }; }
    const body = (await res.json()) as { results?: GeoapifyResult[] };
    const hit = pickGeoapifyGolf(body?.results, club);
    return hit ? { kind: 'match', ...hit } : { kind: 'noMatch' };
  } catch (err) {
    const e = err as Error;
    return { kind: 'httpError', message: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}` };
  } finally {
    clearTimeout(timer);
  }
}
