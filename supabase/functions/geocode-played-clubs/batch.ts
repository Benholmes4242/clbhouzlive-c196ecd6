/** The geocode-played-clubs run loop with injected I/O (unit-testable).
 * Write rules: coordinates only where both are null; stamp on match/noMatch;
 * no stamp on httpError; 'blocked' (403/429) ends the run stamping nothing. */
import type { GeocodeResult } from '../_shared/geocodeGolfClub.ts';
import { shouldStartNext, updateFor, type ClubRow } from './rules.ts';

export interface BatchDeps {
  loadWorkList: () => Promise<ClubRow[]>;
  geocode: (club: ClubRow) => Promise<GeocodeResult>;
  writeCoords: (id: string, coords: { latitude: number; longitude: number }) => Promise<{ error: unknown }>;
  stamp: (id: string, stamp: { geocode_attempted_at: string }) => Promise<{ error: unknown }>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  log: (line: string) => void;
}

export type StopReason = 'done' | 'cap' | 'budget' | 'blocked' | 'emptyWorkList';

export async function runBatch(d: BatchDeps) {
  const start = d.now();
  const work = await d.loadWorkList();
  const workListMs = d.now() - start;
  let processed = 0, located = 0, noMatch = 0, errors = 0;
  let stopReason: StopReason = work.length === 0 ? 'emptyWorkList' : 'done';
  let blockedStatus: number | null = null;
  let firstErrorLogged = false;
  const stamped = new Set<string>();
  for (const club of work) {
    if (!shouldStartNext(d.now() - start, processed)) { stopReason = processed >= 40 ? 'cap' : 'budget'; break; }
    if (processed > 0) await d.sleep(1100);
    const r = await d.geocode(club);
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
    const update = updateFor(r.kind === 'match' ? { kind: 'match', latitude: r.lat, longitude: r.lng } : { kind: 'noMatch' }, new Date(d.now()).toISOString())!;
    if (update.coords) {
      const { error } = await d.writeCoords(club.id, update.coords);
      if (error) { errors++; continue; }
      located++;
    } else noMatch++;
    const { error } = await d.stamp(club.id, update.stamp);
    if (error) errors++; else stamped.add(club.id);
  }
  const remaining = work.filter((c) => !stamped.has(c.id)).length;
  const summary = { processed, located, noMatch, errors, remaining, workListMs, elapsedMs: d.now() - start, stopReason, blockedStatus };
  d.log(`geocode-played-clubs processed=${processed} located=${located} noMatch=${noMatch} errors=${errors} remaining=${remaining} workListMs=${workListMs} elapsedMs=${summary.elapsedMs} stopReason=${stopReason}${blockedStatus != null ? ` status=${blockedStatus}` : ''}`);
  return summary;
}
