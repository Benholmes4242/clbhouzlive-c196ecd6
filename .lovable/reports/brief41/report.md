# Brief 41 — Geocoding: the clubs still stuck

## Files changed
- `supabase/functions/geocode-played-clubs/rules.ts` — `buildStuckList` (no coords, or coords and no town; retry timer ignored; buildWorkList order) and `cleanedClubName` (drop bracketed parts and a trailing ` - <anything>`, collapse spaces; null when unchanged).
- `batch.ts` — after first pass and second pass both return noMatch, one retry through the same `geocode` with the cleaned name and the same `accept` function, paced 1.1s. Writes stay keyed to the club and go through the existing path (coordinates only where latitude/longitude are null). Log line `cleanedNameMatched club=<id> name="<cleaned>"`; summary gains `cleanedLocated`.
- `probe.ts` — `probeStuckError`, `runProbeStuck` (only DB dependency: the club reader); the probe now also reports the cleaned-name pass, anchor lat/lon and `geocode_attempted_at`.
- `handler.ts` — `{ action: "probe_stuck", offset, limit }`, limit 1–10, same admin check, synchronous 200, never writes.
- `index.ts` — `loadPlayed` read split out of `loadWorkList` (unchanged behaviour); `probeStuck` wiring.
- `src/test/brief41Geocode.test.ts` — 7 new tests.

No acceptance rule, guard distance, town radius or retry timer changed. Note: `golfQueryName` already strips brackets from the query text, so for bracket-only names the cleaned retry sends the same search text; what changes is the acceptance input (first distinctive token and exact-name preference are taken from the cleaned name). Dash-suffix names get a genuinely different query.

## Deploy
`geocode-played-clubs` deployed, source SHA-256 `4495820882792d737d3b1d13d6d8101cd555f4505e6b1217514c20f06b27334b`. Not triggered, not scheduled.

## Part A probe run — NOT RUN
The agent's call to the function has no admin session: `probe_stuck` returned **403 Forbidden** (correct behaviour). The five pages need Ben's admin token (see below). No function logs matched `processed=` for the overnight runs, so the never-tried question cannot be answered from logs either, and no SQL was run.

## Part C — pending the probe output
Not produced. No query, candidates, reject reasons, reverse-lookup towns or never-tried evidence are claimed.

## Tests
Focused: 8 geocode files, 101/101 passed (7 new). Full four shards: see close-out.

## Security findings
None touched; no "Fix all".
