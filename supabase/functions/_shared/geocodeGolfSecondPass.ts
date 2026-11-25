/** Second geocoding pass (Brief 22): runs only after the first pass returns
 * noMatch. Anchors on the club's county/state/country boundary (one geocode
 * call, cached per run by region+sub_country), then lists Geoapify Places
 * `sport.golf` features inside it. The category guarantees golf, so "golf" is
 * not required in the name; every distinctive token must be. Several
 * qualifying candidates resolve only by exact name or when all lie within
 * 2km (one course split into features); otherwise noMatch, never a guess.
 * Also hosts the reverse-geocode town lookup. No Deno/npm imports. */
import { geoapifyTown, type AcceptGolfMatch, type GeoapifyResult, type GeocodeResult, type GolfMatch } from './geocodeGolfClub.ts';

const accentNorm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const unbracketed = (s: string) => s.replace(/\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s: string) => accentNorm(unbracketed(s)).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const GENERIC = new Set('golf club clubs course courses centre center country and the hotel resort spa links park hall lakes les des del los las'.split(' '));
const KEEP_IF_EMPTY = new Set(['park', 'hall']);
export const SAME_PLACE_KM = 2;

export function distinctiveTokens(name: string): string[] {
  const long = words(name).filter((w) => Array.from(w).length >= 3);
  const out = long.filter((w) => !GENERIC.has(w));
  return out.length ? out : long.filter((w) => KEEP_IF_EMPTY.has(w));
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const toMatch = (p: GeoapifyResult): GolfMatch | null => {
  const lat = Number(p.lat), lng = Number(p.lon);
  if (p.lat == null || p.lon == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, county: p.county ?? null, state: p.state ?? null, city: geoapifyTown(p) };
};

/** Pure picker over Places results. */
export function pickSecondPass(places: GeoapifyResult[] | null | undefined, clubName: string): GolfMatch | null {
  const tokens = distinctiveTokens(clubName);
  if (!tokens.length || !places) return null;
  const qualifying = places.filter((p) => { const w = new Set(words(p.name ?? '')); return tokens.every((t) => w.has(t)); })
    .map((p) => ({ p, m: toMatch(p) })).filter((x): x is { p: GeoapifyResult; m: GolfMatch } => x.m != null);
  if (qualifying.length === 0) return null;
  if (qualifying.length === 1) return qualifying[0].m;
  const want = words(clubName).join(' ');
  const exact = qualifying.find((x) => words(x.p.name ?? '').join(' ') === want);
  if (exact) return exact.m;
  const all = qualifying.map((x) => x.m);
  const together = all.every((a, i) => all.every((b, j) => j <= i || km(a, b) <= SAME_PLACE_KM));
  return together ? all[0] : null;
}

export type AnchorCache = Map<string, string | null>;
type Fetcher = typeof fetch;
const UA = { 'User-Agent': 'clbhouz/1.0 (https://www.clbhouz.co.uk)' };
type Step = { kind: 'ok'; body: unknown } | Exclude<GeocodeResult, { kind: 'match' } | { kind: 'noMatch' }>;

async function getJson(url: string, fetchFn: Fetcher, timeoutMs: number): Promise<Step> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('Timed out', 'TimeoutError')), timeoutMs);
  try {
    const res = await fetchFn(url, { headers: UA, signal: ctrl.signal });
    if (res.status === 401 || res.status === 403 || res.status === 429) { await res.body?.cancel(); return { kind: 'blocked', status: res.status }; }
    if (!res.ok) { await res.body?.cancel(); return { kind: 'httpError', status: res.status }; }
    return { kind: 'ok', body: await res.json() };
  } catch (err) {
    const e = err as Error;
    return { kind: 'httpError', message: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}` };
  } finally { clearTimeout(timer); }
}

export interface SecondPassDeps {
  fetchFn?: Fetcher; apiKey?: string; timeoutMs?: number;
  /** Spacing before every outgoing request (1.1s in production). */
  pace: () => Promise<void>;
  cache: AnchorCache;
}

/** Anchor types tried in order: region → county then state; no region → state then country. */
export function anchorQueries(club: { region?: string | null; sub_country?: string | null }): { text: string; types: string[] } | null {
  const sub = club.sub_country?.trim();
  if (!sub) return null;
  const region = club.region?.trim();
  return region ? { text: `${region}, ${sub}`, types: ['county', 'state'] } : { text: sub, types: ['state', 'country'] };
}

export async function secondPassGolf(
  club: { name: string; region?: string | null; sub_country?: string | null },
  d: SecondPassDeps,
  acceptMatch?: AcceptGolfMatch,
): Promise<GeocodeResult> {
  const fetchFn = d.fetchFn ?? fetch, timeoutMs = d.timeoutMs ?? 8_000;
  if (!d.apiKey) return { kind: 'httpError', message: 'GEOAPIFY_API_KEY not set' };
  const tokens = distinctiveTokens(club.name);
  const q = anchorQueries(club);
  if (!tokens.length || !q) return { kind: 'noMatch' };
  const cacheKey = `${club.region ?? ''}|${club.sub_country ?? ''}`;
  let anchor = d.cache.get(cacheKey);
  if (anchor === undefined) {
    anchor = null;
    for (const type of q.types) {
      await d.pace();
      const p = new URLSearchParams({ text: q.text, type, format: 'json', limit: '1', lang: 'en', apiKey: d.apiKey });
      const r = await getJson(`https://api.geoapify.com/v1/geocode/search?${p}`, fetchFn, timeoutMs);
      if (r.kind !== 'ok') return r;
      const id = (r.body as { results?: { place_id?: string }[] })?.results?.[0]?.place_id;
      if (id) { anchor = id; break; }
    }
    d.cache.set(cacheKey, anchor);
  }
  if (!anchor) return { kind: 'noMatch' };
  await d.pace();
  // Places `name` is a case-insensitive substring filter; send the longest distinctive token.
  const nameToken = [...tokens].sort((a, b) => b.length - a.length)[0];
  const p = new URLSearchParams({ categories: 'sport.golf', filter: `place:${anchor}`, name: nameToken, limit: '500', lang: 'en', apiKey: d.apiKey });
  const r = await getJson(`https://api.geoapify.com/v2/places?${p}`, fetchFn, timeoutMs);
  if (r.kind !== 'ok') return r;
  const places = ((r.body as { features?: { properties?: GeoapifyResult }[] })?.features ?? []).map((f) => f.properties ?? {});
  const hit = pickSecondPass(places, club.name);
  if (!hit || (acceptMatch && !(await acceptMatch(hit)))) return { kind: 'noMatch' };
  return { kind: 'match', ...hit };
}

export type ReverseResult = { kind: 'town'; town: string | null } | Exclude<GeocodeResult, { kind: 'match' } | { kind: 'noMatch' }>;

/** Town only, from stored coordinates. Never yields coordinates or region. */
export async function reverseTown(lat: number, lon: number, d: Omit<SecondPassDeps, 'cache' | 'pace'>): Promise<ReverseResult> {
  if (!d.apiKey) return { kind: 'httpError', message: 'GEOAPIFY_API_KEY not set' };
  const p = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'json', lang: 'en', apiKey: d.apiKey });
  const r = await getJson(`https://api.geoapify.com/v1/geocode/reverse?${p}`, d.fetchFn ?? fetch, d.timeoutMs ?? 8_000);
  if (r.kind !== 'ok') return r;
  const first = (r.body as { results?: GeoapifyResult[] })?.results?.[0];
  return { kind: 'town', town: first ? geoapifyTown(first) : null };
}
