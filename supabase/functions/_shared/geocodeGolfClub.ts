/** Shared golf-club geocoder over Geoapify (OpenStreetMap data; keyed free plan
 * permits storing results, credit link required on the website). The golf
 * signal uses name/address_line1 plus the club's first distinctive token;
 * state/county/country must match sub_country. Batch region acceptance is
 * injected before picking, so rejected candidates never cause writes. No
 * Deno/npm imports so the picker and the request wrapper are unit-testable. */
export interface GeoapifyResult {
  name?: string | null; address_line1?: string | null; state?: string | null; county?: string | null; city?: string | null;
  suburb?: string | null; village?: string | null; district?: string | null; country_code?: string | null;
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
const unbracketed = (s: string) => s.replace(/\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
const accentNorm = (s: string) => norm(s).normalize('NFD').replace(/\p{M}/gu, '');
const generic = new Set('golf club clubs course courses centre center country and the hotel resort spa links park hall lakes les des del los las'.split(' '));

export function golfQueryName(name: string): string {
  const clean = unbracketed(name);
  return /golf/i.test(clean) ? clean : `${clean} Golf Club`;
}

/** Selected locality travels in the existing city field; no caller shape changes. */
export function geoapifyTown(r: GeoapifyResult): string | null {
  for (const raw of [r.suburb, r.city, r.village]) {
    const value = raw?.trim();
    if (!value || /greater/i.test(value) || /^london borough/i.test(value) || /district|borough|council/i.test(value)
      || ((r.suburb?.trim() || r.village?.trim()) && norm(r.district) !== '' && norm(r.district) === norm(value))
      || [r.county, r.state, r.country].some((v) => norm(v) === norm(value))) continue;
    const town = value.replace(/ Town$/i, '').trim();
    if (town) return town;
  }
  return null;
}

function golfCandidates(results: GeoapifyResult[] | null | undefined, club: { name?: string | null; sub_country?: string | null }): GolfMatch[] {
  const sub = norm(club.sub_country);
  const first = unbracketed(club.name ?? '').toLowerCase().split(/[^\p{L}\p{M}]+/u)
    .find((token) => Array.from(token).length >= 3 && !generic.has(token));
  if (!sub || !results || !first) return [];
  const display = (r: GeoapifyResult) => r.name?.trim() || r.address_line1?.trim() || '';
  const candidates = results.filter((r) => /golf/i.test(display(r))
    && [r.state, r.county, r.country].some((v) => norm(v) === sub)
    && accentNorm(display(r)).includes(accentNorm(first)));
  const want = norm(club.name);
  const ordered = [...candidates.filter((r) => norm(display(r)) === want), ...candidates.filter((r) => norm(display(r)) !== want)];
  return ordered.flatMap((r) => {
    const lat = Number(r.lat), lng = Number(r.lon);
    if (r.lat == null || r.lon == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [{ lat, lng, county: r.county ?? null, state: r.state ?? null, city: geoapifyTown(r) }];
  });
}

export function pickGeoapifyGolf(
  results: GeoapifyResult[] | null | undefined,
  club: { name?: string | null; sub_country?: string | null },
): GolfMatch | null {
  return golfCandidates(results, club)[0] ?? null;
}

export function geoapifyUrl(club: GolfClubPlace, apiKey: string): string {
  const params = new URLSearchParams({
    text: `${golfQueryName(club.name)}, ${club.sub_country ?? ''}`, format: 'json', limit: '10', lang: 'en', apiKey,
  });
  return `https://api.geoapify.com/v1/geocode/search?${params.toString()}`;
}

export const GEOCODE_TIMEOUT_MS = 8_000;
export type AcceptGolfMatch = (match: GolfMatch) => Promise<boolean>;

const envKey = (): string | undefined => {
  try { return (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get('GEOAPIFY_API_KEY'); }
  catch { return undefined; }
};

export async function geocodeGolfClub(
  club: GolfClubPlace,
  fetchFn: typeof fetch = fetch,
  timeoutMs: number = GEOCODE_TIMEOUT_MS,
  apiKey: string | undefined = envKey(),
  acceptMatch?: AcceptGolfMatch,
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
    if (!res.ok) { const body = await errorBody(res); return body ? { kind: 'httpError', status: res.status, message: `body=${body}` } : { kind: 'httpError', status: res.status }; }
    const body = (await res.json()) as { results?: GeoapifyResult[] };
    for (const hit of golfCandidates(body?.results, club)) {
      if (!acceptMatch || await acceptMatch(hit)) return { kind: 'match', ...hit };
    }
    return { kind: 'noMatch' };
  } catch (err) {
    const e = err as Error;
    return { kind: 'httpError', message: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}` };
  } finally {
    clearTimeout(timer);
  }
}

/** First 200 characters of a non-OK body, with any apiKey value removed. */
export async function errorBody(res: Response): Promise<string> {
  let text = '';
  try { text = await res.text(); } catch { return ''; }
  return text.slice(0, 200).replace(/apiKey=[^&\s"']*/gi, 'apiKey=***').replace(/\s+/g, ' ').trim();
}
