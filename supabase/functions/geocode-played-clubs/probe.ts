/** Brief 28 test mode: { action: "probe", club_ids } runs the real lookups for up to
 * ten clubs through a recording fetch and returns what each request saw. It never
 * writes: it receives only a club reader. Every URL has its apiKey masked, and
 * requests keep the 1.1s pacing. No Deno/npm imports (unit-testable). */
import { firstPassReject, geocodeGolfClub, maskKey, type GeoapifyResult } from '../_shared/geocodeGolfClub.ts';
import { distinctiveTokens, pickSecondPassDetailed, reverseLookup, secondPassGolf, secondPassReason } from '../_shared/geocodeGolfSecondPass.ts';
import { cleanedClubName, hasCoords, resolveCandidateRegion, type ClubRow, type RegionResolver } from './rules.ts';

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

/** Brief 41 A: null when valid; otherwise the 400 message. */
export function probeStuckError(offset: unknown, limit: unknown): string | null {
  if (!Number.isInteger(offset) || (offset as number) < 0) return 'offset must be a non-negative integer';
  if (!Number.isInteger(limit) || (limit as number) < 1) return 'limit must be a positive integer';
  if ((limit as number) > PROBE_MAX) return `limit is at most ${PROBE_MAX}`;
  return null;
}

/** Brief 41 A: probes one page of the stuck list. Its only database dependency is the club reader. */
export async function runProbeStuck(offset: number, limit: number, d: Omit<ProbeDeps, 'loadClubs'> & { loadStuck: () => Promise<ClubRow[]> }) {
  const all = await d.loadStuck();
  const page = all.slice(offset, offset + limit);
  return { ...(await runProbeOn(page, d)), total: all.length, offset, limit };
}

export async function runProbe(ids: string[], d: ProbeDeps) {
  return runProbeOn(await d.loadClubs(ids), d);
}

async function runProbeOn(clubs: ClubRow[], d: Omit<ProbeDeps, 'loadClubs'>) {
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
      return { url: x.url, status: x.status, place_id: chosen?.place_id ?? null, lat: chosen?.lat ?? null, lon: chosen?.lon ?? null, result_type: chosen?.result_type ?? null, formatted: chosen?.formatted ?? null,
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
    // Brief 41 B: the cleaned-name retry, run only when both passes found nothing (as the batch does).
    const cleanedName = fr.kind === 'noMatch' && sr.kind === 'noMatch' ? cleanedClubName(club.name) : null;
    let cleaned = null;
    let cr: Awaited<ReturnType<typeof geocodeGolfClub>> | null = null;
    if (cleanedName) {
      const cleanClub = { ...club, name: cleanedName };
      await pace();
      cr = await geocodeGolfClub(cleanClub, recording, undefined, d.apiKey, async (m) => !(await regionMismatch(m)));
      const cq = take()[0];
      const cResults = ((cq?.body as { results?: GeoapifyResult[] })?.results ?? []);
      const rows = [];
      for (const r of cResults.slice(0, 8)) {
        let rule = firstPassReject(r, cleanClub);
        if (!rule && await regionMismatch({ county: r.county ?? null, state: r.state ?? null })) rule = 'region mismatch';
        rows.push({ ...pick(r), rejected: rule });
      }
      cleaned = { name: cleanedName, url: cq?.url ?? null, status: cq?.status ?? null, result_count: cResults.length, results: rows,
        outcome: cr.kind === 'match' ? { picked: { lat: cr.lat, lng: cr.lng, county: cr.county, state: cr.state, town: cr.city } } : { kind: cr.kind } };
    }
    // Resolve any empty town, including address-bearing matches, just as the batch does.
    const selected = fr.kind === 'match' ? fr : sr.kind === 'match' ? sr : cr?.kind === 'match' ? cr : null;
    const point = club.town != null && club.town.trim() !== '' ? null
      : club.latitude != null && club.longitude != null ? { lat: club.latitude, lon: club.longitude }
      : selected ? { lat: selected.lat, lon: selected.lng } : null;
    let reverse = null;
    if (point) {
      await pace();
      const rv = await reverseLookup(point.lat, point.lon, { fetchFn: recording, apiKey: d.apiKey, pace }, hasCoords(club) ? null : selected?.city);
      const rRecs = take();
      const nearbyRec = rRecs.find((x) => x.url.includes('/v2/places'));
      reverse = { requests: rRecs.filter((x) => !x.url.includes('/v2/places')).map((x) => {
        const r0 = (x.body as { results?: GeoapifyResult[] })?.results?.[0] ?? {};
        return { url: x.url, status: x.status, suburb: r0.suburb ?? null, city: r0.city ?? null, town: r0.town ?? null, village: r0.village ?? null,
          hamlet: r0.hamlet ?? null, locality: r0.locality ?? null, county: r0.county ?? null, state: r0.state ?? null, country: r0.country ?? null };
      }), nearby: nearbyRec ? { url: nearbyRec.url, status: nearbyRec.status, choice: rv.kind === 'town' ? rv.nearby ?? null : null } : null,
        would_choose: rv.kind === 'town' ? rv.town : null,
        town_step: rv.kind === 'town' ? rv.townStep ?? null : null,
        distance_km: rv.kind === 'town' ? rv.distanceKm ?? null : null };
    }
    out.push({ id: club.id, name: club.name, sub_country: club.sub_country, region: club.region, latitude: club.latitude,
      longitude: club.longitude, town: club.town, geocode_attempted_at: club.geocode_attempted_at, first_pass, second_pass, cleaned, reverse });
  }
  return { probe: true as const, clubs: out };
}
