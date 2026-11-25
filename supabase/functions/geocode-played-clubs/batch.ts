/** The geocode-played-clubs run loop with injected I/O (unit-testable).
 * Write rules: coordinates only where both are null; stamp on match/noMatch;
 * no stamp on httpError; 'blocked' (401/403/429) ends the run stamping nothing. */
import type { AcceptGolfMatch, GeocodeResult } from '../_shared/geocodeGolfClub.ts';
import { hasCoords, resolveCandidateRegion, resolveRegion, shouldStartNext, updateFor, withinGuard, type ClubRow, type RegionResolver } from './rules.ts';

export interface BatchDeps {
  loadWorkList: () => Promise<ClubRow[]>;
  geocode: (club: ClubRow, acceptMatch?: AcceptGolfMatch) => Promise<GeocodeResult>;
  writeCoords: (id: string, coords: { latitude: number; longitude: number }) => Promise<{ error: unknown }>;
  stamp: (id: string, stamp: { geocode_attempted_at: string }) => Promise<{ error: unknown }>;
  /** Region/town fill; optional so coordinate-only callers stay valid. Writes only where null. */
  resolver?: RegionResolver;
  writeRegion?: (id: string, region: string) => Promise<{ error: unknown }>;
  writeTown?: (id: string, town: string) => Promise<{ error: unknown }>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  log: (line: string) => void;
}

export type StopReason = 'done' | 'cap' | 'budget' | 'blocked' | 'emptyWorkList';

export async function runBatch(d: BatchDeps) {
  const start = d.now();
  const work = await d.loadWorkList();
  const workListMs = d.now() - start;
  let processed = 0, located = 0, noMatch = 0, errors = 0, regionFilled = 0, townFilled = 0, farSkipped = 0, regionMismatch = 0;
  let stopReason: StopReason = work.length === 0 ? 'emptyWorkList' : 'done';
  let blockedStatus: number | null = null;
  let firstErrorLogged = false;
  const stamped = new Set<string>();
  for (const club of work) {
    if (!shouldStartNext(d.now() - start, processed)) { stopReason = processed >= 40 ? 'cap' : 'budget'; break; }
    if (processed > 0) await d.sleep(1100);
    const resolver = d.resolver;
    // Canonical-to-canonical: the stored region is resolved first; unresolved skips the check.
    const storedRegion = club.region != null && resolver
      ? await resolveCandidateRegion(club, { county: club.region, state: null }, resolver) : null;
    const r = await d.geocode(club, storedRegion && resolver ? async (candidate) => {
      const region = await resolveCandidateRegion(club, candidate, resolver);
      if (region && region !== storedRegion) { regionMismatch++; return false; }
      return true;
    } : undefined);
    processed++;
    if (r.kind === 'blocked') { errors++; stopReason = 'blocked'; blockedStatus = r.status; break; }
    if (r.kind === 'httpError') {
      errors++;
      if (!firstErrorLogged) {
        firstErrorLogged = true;
        d.log(`geocode-played-clubs firstHttpError club=${club.id} ${r.status != null ? `status=${r.status}` : r.message}`);
      }
      continue;
    }
    const update = updateFor(r.kind === 'match' ? { kind: 'match', latitude: r.lat, longitude: r.lng } : { kind: 'noMatch' }, new Date(d.now()).toISOString());
    if (!update) continue;
    if (r.kind === 'match') {
      if (!hasCoords(club)) {
        if (!update.coords) continue;
        const { error } = await d.writeCoords(club.id, update.coords);
        if (error) { errors++; continue; }
        located++;
      }
      if (!withinGuard(club, r)) {
        farSkipped++;
        d.log(`geocode-played-clubs far club=${club.id}`);
      } else {
        if (d.resolver && d.writeRegion) {
          const region = await resolveRegion(club, r, d.resolver);
          if (region) { if ((await d.writeRegion(club.id, region)).error) errors++; else regionFilled++; }
        }
        const town = r.city?.trim();
        if (town && (club.town == null || club.town.trim() === '') && d.writeTown) {
          if ((await d.writeTown(club.id, town)).error) errors++; else townFilled++;
        }
      }
    } else noMatch++;
    const { error } = await d.stamp(club.id, update.stamp);
    if (error) errors++; else stamped.add(club.id);
  }
  const remaining = work.filter((c) => !stamped.has(c.id)).length;
  const summary = { processed, located, noMatch, errors, regionFilled, townFilled, farSkipped, regionMismatch, remaining, workListMs, elapsedMs: d.now() - start, stopReason, blockedStatus };
  d.log(`geocode-played-clubs processed=${processed} located=${located} noMatch=${noMatch} errors=${errors} regionFilled=${regionFilled} townFilled=${townFilled} farSkipped=${farSkipped} regionMismatch=${regionMismatch} remaining=${remaining} workListMs=${workListMs} elapsedMs=${summary.elapsedMs} stopReason=${stopReason}${blockedStatus != null ? ` status=${blockedStatus}` : ''}`);
  return summary;
}
