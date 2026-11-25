/** Second geocoding pass (Brief 22): runs only after the first pass returns
 * noMatch. Anchors on the club's county/state/country boundary (one geocode
 * call, cached per run by region+sub_country), then lists Geoapify Places
 * `sport.golf_course` features inside it. The category guarantees golf, so "golf" is
 * not required in the name; every distinctive token must be. Several
 * qualifying candidates resolve only by exact name or when all lie within
 * 5km (courses at one resort); otherwise noMatch, never a guess.
 * Also hosts the reverse-geocode town lookup. No Deno/npm imports. */
import { errorBody, geoapifyPlaceName, geoapifyTown, inNation, nationOf, type AcceptGolfMatch, type GeoapifyResult, type GeocodeResult, type GolfMatch } from './geocodeGolfClub.ts';

const accentNorm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const unbracketed = (s: string) => s.replace(/\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s: string) => accentNorm(unbracketed(s)).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const GENERIC = new Set('golf club clubs course courses centre center country and the hotel resort spa links park hall lakes les des del los las'.split(' '));
const KEEP_IF_EMPTY = new Set(['park', 'hall']);
const WEAK = new Set('old new royal north south east west upper lower great little saint'.split(' '));
export const SAME_PLACE_KM = 5;

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

/** Places' substring filter starts with the first strong distinctive token. */
export function secondPassNameToken(tokens: string[]): string | null {
  if (!tokens.length) return null;
  return tokens.find((token) => !WEAK.has(token)) ?? [...tokens].sort((a, b) => b.length - a.length)[0];
}

function fallbackTokens(tokens: string[]): string[] {
  if (tokens[0] && WEAK.has(tokens[0]) && tokens.length > 1) return tokens.slice(0, 2);
  const strong = secondPassNameToken(tokens);
  return strong ? [strong] : [];
}

function candidatesFor(places: GeoapifyResult[], tokens: string[]) {
  return places.filter((p) => { const w = new Set(words(p.name ?? '')); return tokens.length > 0 && tokens.every((t) => w.has(t)); })
    .map((p) => ({ p, m: toMatch(p) })).filter((x): x is { p: GeoapifyResult; m: GolfMatch } => x.m != null);
}

export interface SecondPassPick { match: GolfMatch; rule: 1 | 2 }

/** All tokens first; only an empty result may use the guarded weak-token rule. */
export function pickSecondPassDetailed(places: GeoapifyResult[] | null | undefined, clubName: string): SecondPassPick | null {
  const tokens = distinctiveTokens(clubName);
  if (!tokens.length || !places) return null;
  let rule: 1 | 2 = 1;
  let qualifying = candidatesFor(places, tokens);
  if (qualifying.length === 0) {
    rule = 2;
    qualifying = candidatesFor(places, fallbackTokens(tokens));
  }
  if (qualifying.length === 0) return null;
  let match = qualifying.length === 1 ? qualifying[0].m : null;
  if (!match) {
    const want = words(clubName).join(' ');
    match = qualifying.find((x) => words(x.p.name ?? '').join(' ') === want)?.m ?? null;
  }
  if (!match) {
    const all = qualifying.map((x) => x.m);
    const together = all.every((a, i) => all.every((b, j) => j <= i || km(a, b) <= SAME_PLACE_KM));
    if (together) match = all[0];
  }
  return match ? { match: { ...match, pickerRule: rule }, rule } : null;
}

/** Brief 28 probe: why the picker returns nothing, or null when it picks. */
export function secondPassReason(places: GeoapifyResult[] | null | undefined, clubName: string): string | null {
  if (pickSecondPass(places, clubName)) return null;
  const tokens = distinctiveTokens(clubName);
  const full = candidatesFor(places ?? [], tokens);
  const fallback = full.length === 0 ? candidatesFor(places ?? [], fallbackTokens(tokens)) : [];
  return full.length + fallback.length > 0 ? 'several far apart' : 'no qualifying name';
}

/** Pure picker over Places results. */
export function pickSecondPass(places: GeoapifyResult[] | null | undefined, clubName: string): GolfMatch | null {
  return pickSecondPassDetailed(places, clubName)?.match ?? null;
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
    if (!res.ok) { const body = await errorBody(res); return body ? { kind: 'httpError', status: res.status, message: `body=${body}` } : { kind: 'httpError', status: res.status }; }
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

export interface AnchorQuery { text: string; types: (string | null)[]; region: boolean }

/** Region anchors are untyped and choose a county/state from five results;
 * nation anchors remain the typed state-then-country lookup. */
export function anchorQueries(club: { region?: string | null; sub_country?: string | null }): AnchorQuery | null {
  const sub = nationOf(club.sub_country);
  if (!sub) return null;
  const region = club.region?.trim();
  return region ? { text: `${region}, ${sub}`, types: [null], region: true } : { text: sub, types: ['state', 'country'], region: false };
}

/** Brief 28 D2: the nation anchor used once when the region-anchored search finds nothing. */
export function nationalAnchor(club: { sub_country?: string | null }): AnchorQuery | null {
  const sub = nationOf(club.sub_country);
  return sub ? { text: sub, types: ['state', 'country'], region: false } : null;
}

export async function secondPassGolf(
  club: { name: string; region?: string | null; sub_country?: string | null },
  d: SecondPassDeps,
  acceptMatch?: AcceptGolfMatch,
): Promise<GeocodeResult> {
  const fetchFn = d.fetchFn ?? fetch, timeoutMs = d.timeoutMs ?? 8_000;
  if (!d.apiKey) return { kind: 'httpError', message: 'GEOAPIFY_API_KEY not set' };
  const apiKey = d.apiKey;
  const tokens = distinctiveTokens(club.name);
  const q = anchorQueries(club);
  if (!tokens.length || !q) return { kind: 'noMatch' };
  const search = async (anchorQ: AnchorQuery, cacheKey: string, accept?: AcceptGolfMatch): Promise<GeocodeResult> => {
    let anchor = d.cache.get(cacheKey);
    if (anchor === undefined) {
      anchor = null;
      for (const type of anchorQ.types) {
        await d.pace();
        const p = new URLSearchParams({ text: anchorQ.text, format: 'json', limit: type == null ? '5' : '1', lang: 'en', apiKey,
          ...(type == null ? {} : { type }) });
        const r = await getJson(`https://api.geoapify.com/v1/geocode/search?${p}`, fetchFn, timeoutMs);
        if (r.kind !== 'ok') return r;
        const results = (r.body as { results?: GeoapifyResult[] })?.results ?? [];
        const chosen = anchorQ.region ? results.find((x) => x.result_type === 'county' || x.result_type === 'state') : results[0];
        const id = chosen?.place_id;
        if (id) { anchor = id; break; }
      }
      d.cache.set(cacheKey, anchor);
    }
    if (!anchor) return { kind: 'noMatch' };
    await d.pace();
    // Places `name` is a case-insensitive substring filter; weak lead words do not narrow usefully.
    const nameToken = secondPassNameToken(tokens)!;
    const p = new URLSearchParams({ categories: 'sport.golf_course', filter: `place:${anchor}`, name: nameToken, limit: '500', lang: 'en', apiKey });
    const r = await getJson(`https://api.geoapify.com/v2/places?${p}`, fetchFn, timeoutMs);
    if (r.kind !== 'ok') return r;
    const places = ((r.body as { features?: { properties?: GeoapifyResult }[] })?.features ?? []).map((f) => f.properties ?? {});
    const picked = pickSecondPassDetailed(places, club.name);
    if (!picked || (accept && !(await accept(picked.match)))) return { kind: 'noMatch' };
    return { kind: 'match', ...picked.match };
  };
  const regional = await search(q, `${club.region ?? ''}|${club.sub_country ?? ''}`, acceptMatch);
  // A club with no region was already nation-anchored; a stored region gets one national retry without its guard.
  if (regional.kind !== 'noMatch' || !club.region?.trim()) return regional;
  const n = nationalAnchor(club);
  if (!n) return regional;
  const national = await search(n, `|${nationOf(club.sub_country)}`);
  return national.kind === 'match' ? { ...national, national: true } : national;
}

export interface NearbyTown { name: string; distanceKm: number; categories: string[] }
const PRIMARY_PLACES = new Set(['populated_place.city', 'populated_place.town', 'populated_place.village']);
const SECONDARY_PLACES = new Set(['populated_place.suburb', 'populated_place.hamlet']);

/** Nearest named settlement within the requested 5km circle; primary settlements beat suburbs/hamlets. */
export function pickNearbyTown(places: GeoapifyResult[] | null | undefined, lat: number, lon: number): NearbyTown | null {
  const ranked = (places ?? []).flatMap((p) => {
    const categories = p.categories ?? [];
    const name = geoapifyPlaceName(p.name, p);
    const plat = Number(p.lat), plon = Number(p.lon);
    if (!name || p.lat == null || p.lon == null || !Number.isFinite(plat) || !Number.isFinite(plon)) return [];
    const distanceKm = km({ lat, lng: lon }, { lat: plat, lng: plon });
    if (distanceKm > 5) return [];
    const rank = categories.some((c) => PRIMARY_PLACES.has(c)) ? 0 : categories.some((c) => SECONDARY_PLACES.has(c)) ? 1 : null;
    return rank == null ? [] : [{ name, distanceKm, categories, rank }];
  });
  ranked.sort((a, b) => a.rank - b.rank || a.distanceKm - b.distanceKm);
  const chosen = ranked[0];
  return chosen ? { name: chosen.name, distanceKm: chosen.distanceKm, categories: chosen.categories } : null;
}

export type ReverseResult = { kind: 'town'; town: string | null } | Exclude<GeocodeResult, { kind: 'match' } | { kind: 'noMatch' }>;

export interface ReversePlace { suburb: string | null; city: string | null; town: string | null; village: string | null; hamlet: string | null;
  locality: string | null; county: string | null; state: string | null; country: string | null }
export type ReverseLookup = { kind: 'town'; town: string | null; place: ReversePlace | null; nearby?: NearbyTown | null } | Exclude<GeocodeResult, { kind: 'match' } | { kind: 'noMatch' }>;

const placeOf = (r: GeoapifyResult): ReversePlace => ({ suburb: r.suburb ?? null, city: r.city ?? null, town: r.town ?? null, village: r.village ?? null,
  hamlet: r.hamlet ?? null, locality: r.locality ?? null, county: r.county ?? null, state: r.state ?? null, country: r.country ?? null });

/** Reverse lookup of stored coordinates: town plus the place fields (nation check).
 * Brief 28 B2: no town from the first answer → one more request with type=city. */
export async function reverseLookup(lat: number, lon: number, d: Omit<SecondPassDeps, 'cache' | 'pace'> & { pace?: () => Promise<void> }): Promise<ReverseLookup> {
  if (!d.apiKey) return { kind: 'httpError', message: 'GEOAPIFY_API_KEY not set' };
  const req = async (type?: string) => {
    const p = new URLSearchParams({ lat: String(lat), lon: String(lon), ...(type ? { type } : {}), format: 'json', lang: 'en', apiKey: d.apiKey! });
    return getJson(`https://api.geoapify.com/v1/geocode/reverse?${p}`, d.fetchFn ?? fetch, d.timeoutMs ?? 8_000);
  };
  const r = await req();
  if (r.kind !== 'ok') return r;
  const first = (r.body as { results?: GeoapifyResult[] })?.results?.[0];
  const town = first ? geoapifyTown(first) : null;
  if (town) return { kind: 'town', town, place: placeOf(first!) };
  if (d.pace) await d.pace();
  const c = await req('city');
  if (c.kind !== 'ok') return c;
  const city = (c.body as { results?: GeoapifyResult[] })?.results?.[0];
  const cityTown = city ? geoapifyTown(city) : null;
  const place = first ? placeOf(first) : city ? placeOf(city) : null;
  if (cityTown) return { kind: 'town', town: cityTown, place };
  if (d.pace) await d.pace();
  const p = new URLSearchParams({
    categories: 'populated_place.city,populated_place.town,populated_place.village,populated_place.suburb,populated_place.hamlet',
    filter: `circle:${lon},${lat},5000`, bias: `proximity:${lon},${lat}`, limit: '20', lang: 'en', apiKey: d.apiKey!,
  });
  const nearby = await getJson(`https://api.geoapify.com/v2/places?${p}`, d.fetchFn ?? fetch, d.timeoutMs ?? 8_000);
  if (nearby.kind !== 'ok') return nearby;
  const features = ((nearby.body as { features?: { properties?: GeoapifyResult }[] })?.features ?? []).map((f) => f.properties ?? {});
  const chosen = pickNearbyTown(features, lat, lon);
  return { kind: 'town', town: chosen?.name ?? null, place, nearby: chosen };
}

/** Brief 28 C1: true when the reverse place is known and lies outside the club's nation. */
export function pinOutsideNation(place: ReversePlace | null, sub: string | null | undefined): boolean {
  return !!place && !!nationOf(sub) && !inNation(place, sub);
}

/** Town only, from stored coordinates. Never yields coordinates or region. */
export async function reverseTown(lat: number, lon: number, d: Omit<SecondPassDeps, 'cache' | 'pace'> & { pace?: () => Promise<void> }): Promise<ReverseResult> {
  const r = await reverseLookup(lat, lon, d);
  return r.kind === 'town' ? { kind: 'town', town: r.town } : r;
}
