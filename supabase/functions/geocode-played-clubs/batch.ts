/** The geocode-played-clubs run loop with injected I/O (unit-testable).
 * Write rules: coordinates only where both are null; stamp on match/noMatch;
 * httpError on one club (timeouts included) stamps a date that brings it back in 7 days; 'blocked' (401/403/429) ends the run stamping nothing. */
import type { AcceptGolfMatch, GeocodeResult } from '../_shared/geocodeGolfClub.ts';
import { pinOutsideNation, type ReverseLookup, type ReverseResult } from '../_shared/geocodeGolfSecondPass.ts';
import { hasCoords, resolveCandidateRegion, resolveRegion, shouldStartNext, updateFor, withinGuard, type ClubRow, type RegionResolver } from './rules.ts';

export interface BatchDeps {
  loadWorkList: () => Promise<ClubRow[]>;
  geocode: (club: ClubRow, acceptMatch?: AcceptGolfMatch) => Promise<GeocodeResult>;
  /** Also fills the club's golf_courses rows whose latitude is null; `courses` is how many (Brief 28 E1). */
  writeCoords: (id: string, coords: { latitude: number; longitude: number }) => Promise<{ error: unknown; courses?: number }>;
  stamp: (id: string, stamp: { geocode_attempted_at: string }) => Promise<{ error: unknown }>;
  /** Region/town fill; optional so coordinate-only callers stay valid. Writes only where null. */
  resolver?: RegionResolver;
  writeRegion?: (id: string, region: string) => Promise<{ error: unknown }>;
  writeTown?: (id: string, town: string) => Promise<{ error: unknown }>;
  /** Brief 22 second pass; called only after a first-pass noMatch. */
  secondPass?: (club: ClubRow, acceptMatch?: AcceptGolfMatch) => Promise<GeocodeResult>;
  /** Brief 22 town-only reverse lookup for clubs with coordinates and no town. */
  reverseTown?: (club: ClubRow, matchAddress?: string | null) => Promise<ReverseResult | ReverseLookup>;
  /** Brief 28 C1: clears a pin outside the club's nation (club lat/lng/town, attempt null; courses on the old pin). */
  clearPin?: (id: string, oldPin: { latitude: number; longitude: number }) => Promise<{ error: unknown }>;
  /** Brief 28 D3: corrects the club's region and its courses whose region equals the old value. */
  correctRegion?: (id: string, from: string | null, to: string) => Promise<{ error: unknown }>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  log: (line: string) => void;
}

export type StopReason = 'done' | 'cap' | 'budget' | 'blocked' | 'emptyWorkList';

export async function runBatch(d: BatchDeps) {
  const start = d.now();
  const work = await d.loadWorkList();
  const workListMs = d.now() - start;
  let processed = 0, located = 0, noMatch = 0, errors = 0, regionFilled = 0, townFilled = 0, farSkipped = 0, regionMismatch = 0, secondPassLocated = 0, wrongPinCleared = 0, regionCorrected = 0, coursesFilled = 0;
  let stopReason: StopReason = work.length === 0 ? 'emptyWorkList' : 'done';
  let blockedStatus: number | null = null;
  let firstErrorLogged = false;
  const stamped = new Set<string>();
  for (const club of work) {
    if (!shouldStartNext(d.now() - start, processed)) { stopReason = processed >= 40 ? 'cap' : 'budget'; break; }
    if (processed > 0) await d.sleep(1100);
    if (d.reverseTown && hasCoords(club) && (club.town == null || club.town.trim() === '')) {
      const rv = await d.reverseTown(club);
      processed++;
      if (rv.kind === 'blocked') { errors++; stopReason = 'blocked'; blockedStatus = rv.status; break; }
      if (rv.kind === 'httpError') {
        errors++;
        const back = updateFor({ kind: 'httpError' }, new Date(d.now()).toISOString());
        if (back && !(await d.stamp(club.id, back.stamp)).error) stamped.add(club.id);
        continue;
      }
      const place = 'place' in rv ? rv.place : null;
      if (d.clearPin && pinOutsideNation(place, club.sub_country)) {
        // The only case where stored coordinates are removed; no stamp, so the next run geocodes it.
        if ((await d.clearPin(club.id, { latitude: club.latitude!, longitude: club.longitude! })).error) errors++;
        else { wrongPinCleared++; stamped.add(club.id); d.log(`geocode-played-clubs wrongPinCleared club=${club.id}`); }
        continue;
      }
      const town = rv.town?.trim();
      if (town && d.writeTown) { if ((await d.writeTown(club.id, town)).error) errors++; else townFilled++; }
      const { error } = await d.stamp(club.id, { geocode_attempted_at: new Date(d.now()).toISOString() });
      if (error) errors++; else stamped.add(club.id);
      continue;
    }
    const resolver = d.resolver;
    // Canonical-to-canonical: the stored region is resolved first; unresolved skips the check.
    const storedRegion = club.region != null && resolver
      ? await resolveCandidateRegion(club, { county: club.region, state: null }, resolver) : null;
    const accept: AcceptGolfMatch | undefined = storedRegion && resolver ? async (candidate) => {
      const region = await resolveCandidateRegion(club, candidate, resolver);
      if (region && region !== storedRegion) { regionMismatch++; return false; }
      return true;
    } : undefined;
    let r = await d.geocode(club, accept);
    if (r.kind === 'noMatch' && d.secondPass) {
      r = await d.secondPass(club, accept);
      if (r.kind === 'match') {
        secondPassLocated++;
        if (r.pickerRule) d.log(`geocode-played-clubs secondPassPickerRule=${r.pickerRule} club=${club.id}`);
      }
    }
    processed++;
    if (r.kind === 'blocked') { errors++; stopReason = 'blocked'; blockedStatus = r.status; break; }
    if (r.kind === 'httpError') {
      errors++;
      if (!firstErrorLogged) {
        firstErrorLogged = true;
        d.log(`geocode-played-clubs firstHttpError club=${club.id} ${[r.status != null ? `status=${r.status}` : null, r.message].filter(Boolean).join(' ')}`);
      }
      const back = updateFor({ kind: 'httpError' }, new Date(d.now()).toISOString());
      if (back && !(await d.stamp(club.id, back.stamp)).error) stamped.add(club.id);
      continue;
    }
    const update = updateFor(r.kind === 'match' ? { kind: 'match', latitude: r.lat, longitude: r.lng } : { kind: 'noMatch' }, new Date(d.now()).toISOString());
    if (!update) continue;
    if (r.kind === 'match') {
      let town = r.city?.trim();
      if ((club.town == null || club.town.trim() === '') && d.reverseTown && d.writeTown) {
        await d.sleep(1100);
        const point = { ...club, latitude: r.lat, longitude: r.lng };
        const rv = town ? await d.reverseTown(point, town) : await d.reverseTown(point);
        if (rv.kind === 'blocked') { errors++; stopReason = 'blocked'; blockedStatus = rv.status; break; }
        if (rv.kind === 'httpError') {
          errors++;
          const back = updateFor({ kind: 'httpError' }, new Date(d.now()).toISOString());
          if (back && !(await d.stamp(club.id, back.stamp)).error) stamped.add(club.id);
          continue;
        }
        town = rv.town?.trim();
      }
      if (!hasCoords(club)) {
        if (!update.coords) continue;
        const { error, courses } = await d.writeCoords(club.id, update.coords);
        if (error) { errors++; continue; }
        located++;
        coursesFilled += courses ?? 0;
      }
      if (!withinGuard(club, r)) {
        farSkipped++;
        d.log(`geocode-played-clubs far club=${club.id}`);
      } else {
        if (r.national && d.resolver && d.correctRegion && club.region != null) {
          const to = await resolveCandidateRegion(club, r, d.resolver);
          if (to && to !== club.region) {
            if ((await d.correctRegion(club.id, club.region, to)).error) errors++;
            else { regionCorrected++; d.log(`regionCorrected club=${club.id} from=${club.region} to=${to}`); }
          }
        }
        if (d.resolver && d.writeRegion) {
          const region = await resolveRegion(club, r, d.resolver);
          if (region) { if ((await d.writeRegion(club.id, region)).error) errors++; else regionFilled++; }
        }
        if (town && (club.town == null || club.town.trim() === '') && d.writeTown) {
          if ((await d.writeTown(club.id, town)).error) errors++; else townFilled++;
        }
      }
    } else noMatch++;
    const { error } = await d.stamp(club.id, update.stamp);
    if (error) errors++; else stamped.add(club.id);
  }
  const remaining = work.filter((c) => !stamped.has(c.id)).length;
  const summary = { processed, located, noMatch, errors, regionFilled, townFilled, farSkipped, regionMismatch, secondPassLocated, wrongPinCleared, regionCorrected, coursesFilled, remaining, workListMs, elapsedMs: d.now() - start, stopReason, blockedStatus };
  d.log(`geocode-played-clubs processed=${processed} located=${located} noMatch=${noMatch} errors=${errors} regionFilled=${regionFilled} townFilled=${townFilled} farSkipped=${farSkipped} regionMismatch=${regionMismatch} secondPassLocated=${secondPassLocated} wrongPinCleared=${wrongPinCleared} regionCorrected=${regionCorrected} coursesFilled=${coursesFilled} remaining=${remaining} workListMs=${workListMs} elapsedMs=${summary.elapsedMs} stopReason=${stopReason}${blockedStatus != null ? ` status=${blockedStatus}` : ''}`);
  return summary;
}
