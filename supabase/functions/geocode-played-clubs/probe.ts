/** Brief 28 test mode: { action: "probe", club_ids } runs the real lookups for up to
 * ten clubs through a recording fetch and returns what each request saw. It never
 * writes: it receives only a club reader. Every URL has its apiKey masked, and
 * requests keep the 1.1s pacing. No Deno/npm imports (unit-testable). */
import { firstPassReject, geocodeGolfClub, maskKey, type GeoapifyResult } from '../_shared/geocodeGolfClub.ts';
import { distinctiveTokens, pickSecondPassDetailed, reverseLookup, secondPassGolf, secondPassReason } from '../_shared/geocodeGolfSecondPass.ts';
import { hasCoords, resolveCandidateRegion, type ClubRow, type RegionResolver } from './rules.ts';

export const PROBE_MAX = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Null when valid; otherwise the 400 message. */
export function probeIdsError(ids: unknown): string | null {
  if (!Array.isArray(ids) || ids.length === 0) return 'club_ids must be a non-empty array';
  if (ids.length > PROBE_MAX) return `club_ids holds at most ${PROBE_MAX}`;
  if (!ids.every((v) => typeof v === 'string' && UUID.test(v))) return 'club_ids must be uuids';
  return null;
}

interface Rec { url: string; status: number | null; body: unknown }
export interface ProbeDeps {
  loadClubs: (ids: string[]) => Promise<ClubRow[]>;
  fetchFn?: typeof fetch;
  apiKey?: string;
  sleep: (ms: number) => Promise<void>;
  resolver?: RegionResolver;
}

const pick = (r: GeoapifyResult) => ({ name: r.name ?? r.address_line1 ?? null, result_type: r.result_type ?? null, county: r.county ?? null,
  state: r.state ?? null, country: r.country ?? null, lat: r.lat ?? null, lon: r.lon ?? null });

export async function runProbe(ids: string[], d: ProbeDeps) {
  const clubs = await d.loadClubs(ids);
  const base = d.fetchFn ?? fetch;
  let recs: Rec[] = [];
  let started = false;
  const pace = async () => { if (started) await d.sleep(1100); started = true; };
  const recording = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = maskKey(String(input));
    try {
      const res = await base(input, init);
      let body: unknown = null;
      try { body = await res.clone().json(); } catch { body = null; }
      recs.push({ url, status: res.status, body });
      return res;
    } catch (err) { recs.push({ url, status: null, body: null }); throw err; }
  }) as typeof fetch;
  const take = () => { const out = recs; recs = []; return out; };
  const out = [];
  for (const club of clubs) {
    const storedRegion = club.region != null && d.resolver
      ? await resolveCandidateRegion(club, { county: club.region, state: null }, d.resolver) : null;
    const regionMismatch = async (m: { county: string | null; state: string | null }) => {
      if (!storedRegion || !d.resolver) return false;
      const region = await resolveCandidateRegion(club, m, d.resolver);
      return !!region && region !== storedRegion;
    };
    // First pass
    await pace();
    const fr = await geocodeGolfClub(club, recording, undefined, d.apiKey, async (m) => !(await regionMismatch(m)));
    const fq = take()[0];
    const results = ((fq?.body as { results?: GeoapifyResult[] })?.results ?? []);
    const firstRows = [];
    for (const r of results.slice(0, 8)) {
      let rule = firstPassReject(r, club);
      if (!rule && await regionMismatch({ county: r.county ?? null, state: r.state ?? null })) rule = 'region mismatch';
      firstRows.push({ ...pick(r), rejected: rule });
    }
    const first_pass = { url: fq?.url ?? null, status: fq?.status ?? null, result_count: results.length, results: firstRows,
      outcome: fr.kind === 'match' ? { picked: { lat: fr.lat, lng: fr.lng, county: fr.county, state: fr.state, town: fr.city } } : { kind: fr.kind, ...('status' in fr ? { status: fr.status } : {}), ...('message' in fr && fr.message ? { message: maskKey(fr.message) } : {}) } };
    // Second pass (always probed, with a fresh anchor cache)
    const sr = await secondPassGolf(club, { fetchFn: recording, apiKey: d.apiKey, cache: new Map(), pace }, async (m) => !(await regionMismatch(m)));
    const sRecs = take();
    const anchors = sRecs.filter((x) => x.url.includes('/v1/geocode/search')).map((x) => {
      const results = (x.body as { results?: GeoapifyResult[] })?.results ?? [];
      const typed = new URL(x.url).searchParams.has('type');
      const chosen = typed ? results[0] : results.find((r) => r.result_type === 'county' || r.result_type === 'state');
      return { url: x.url, status: x.status, place_id: chosen?.place_id ?? null, result_type: chosen?.result_type ?? null, formatted: chosen?.formatted ?? null,
        results: results.slice(0, 5).map((r) => ({ place_id: r.place_id ?? null, result_type: r.result_type ?? null, formatted: r.formatted ?? null })),
        chosen: chosen ? { place_id: chosen.place_id ?? null, result_type: chosen.result_type ?? null, formatted: chosen.formatted ?? null } : null };
    });
    const places = sRecs.filter((x) => x.url.includes('/v2/places')).map((x) => {
      const feats = ((x.body as { features?: { properties?: GeoapifyResult & { categories?: string[] } }[] })?.features ?? []).map((f) => f.properties ?? {});
      return { url: x.url, status: x.status, feature_count: feats.length,
        features: feats.slice(0, 15).map((f) => ({ name: f.name ?? null, county: f.county ?? null, state: f.state ?? null, categories: (f as { categories?: string[] }).categories ?? null })),
        picker_rule: pickSecondPassDetailed(feats, club.name)?.rule ?? null,
        reason: secondPassReason(feats, club.name) };
    });
    const why = sr.kind === 'match' ? null
      : sr.kind !== 'noMatch' ? sr.kind
      : places.length === 0 ? 'no anchor'
      : places[places.length - 1].reason ?? 'region mismatch';
    const second_pass = { tokens: distinctiveTokens(club.name), anchors, places, picker_rule: sr.kind === 'match' ? sr.pickerRule ?? null : null,
      outcome: sr.kind === 'match' ? { picked: { lat: sr.lat, lng: sr.lng, county: sr.county, state: sr.state, town: sr.city, national: !!sr.national } } : { rejected: why } };
    // Reverse stored coordinates, or a townless match just as the batch does.
    const selected = fr.kind === 'match' ? fr : sr.kind === 'match' ? sr : null;
    const point = hasCoords(club) ? { lat: club.latitude!, lon: club.longitude! }
      : selected && !selected.city && (club.town == null || club.town.trim() === '') ? { lat: selected.lat, lon: selected.lng } : null;
    let reverse = null;
    if (point) {
      await pace();
      const rv = await reverseLookup(point.lat, point.lon, { fetchFn: recording, apiKey: d.apiKey, pace });
      const rRecs = take();
      const nearbyRec = rRecs.find((x) => x.url.includes('/v2/places'));
      reverse = { requests: rRecs.filter((x) => !x.url.includes('/v2/places')).map((x) => {
        const r0 = (x.body as { results?: GeoapifyResult[] })?.results?.[0] ?? {};
        return { url: x.url, status: x.status, suburb: r0.suburb ?? null, city: r0.city ?? null, town: r0.town ?? null, village: r0.village ?? null,
          hamlet: r0.hamlet ?? null, locality: r0.locality ?? null, county: r0.county ?? null, state: r0.state ?? null, country: r0.country ?? null };
      }), nearby: nearbyRec ? { url: nearbyRec.url, status: nearbyRec.status, choice: rv.kind === 'town' ? rv.nearby ?? null : null } : null,
        would_choose: rv.kind === 'town' ? rv.town : null };
    }
    out.push({ id: club.id, name: club.name, sub_country: club.sub_country, region: club.region, latitude: club.latitude,
      longitude: club.longitude, town: club.town, first_pass, second_pass, reverse });
  }
  return { probe: true as const, clubs: out };
}
