# Brief 19 — geocode-played-clubs

Files: supabase/functions/geocode-played-clubs/index.ts, supabase/functions/geocode-played-clubs/rules.ts,
supabase/functions/_shared/pickGolfResult.ts, supabase/config.toml (verify_jwt = false), src/test/geocodePlayedClubs.test.ts (new, 8 tests).
Types already contained golf_clubs.geocode_attempted_at; no types change needed. No SQL, no migration, no admin UI change.

Response: { processed, located, noMatch, errors, remaining }. One summary log line per run.
Auth: x-internal-secret via requireInternalSecret, else is_admin RPC; anything else 403 (verified live: no-auth POST -> 403).
Coordinates: written only on a match, with update ... .is('latitude', null).is('longitude', null); existing coordinates cannot be overwritten.
HTTP error/timeout stamps nothing; first 429 ends the run.
Deployed: POST https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/geocode-played-clubs

| Shard | Files | Tests |
|---|---|---|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,610 |
| 4/4 | 223 | 2,824 |
| Total | 901 | 10,443 |

Delta vs 10,435/900: +8 tests / +1 file, all from src/test/geocodePlayedClubs.test.ts. No existing test edited; no timeouts or retries.

## Brief 19b — reply immediately, background batch with time budget

- `handler.ts` (new): `createHandler` — auth synchronous (403 unchanged); authorised calls get `202 {"started":true}` and the batch runs through `EdgeRuntime.waitUntil`.
- `rules.ts`: `TIME_BUDGET_MS = 100_000`, `shouldStartNext(elapsedMs, processed)` (false past 100,000 ms or at 40).
- `index.ts`: Nominatim timeout 10 s → 8 s; one summary line `processed located noMatch errors remaining workListMs elapsedMs stopReason` (done|cap|budget|rateLimited|emptyWorkList); first httpError per run logged once (`status=N` or `Name: message`). Write rules unchanged.
- Tests: new `src/test/geocodePlayedClubsBudget.test.ts` (5). Existing 8 unedited, green.

| Shard | Files | Tests |
|---|---|---|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,610 |
| 4/4 | 224 | 2,829 |
| **Total** | **902** | **10,448** |

Delta vs 10,443 / 901: +5 tests, +1 file, all from geocodePlayedClubsBudget.test.ts. No timeouts, no reruns.

Live verification: redeployed. Unauthenticated call → 403. The admin manual call could not be made from the agent (no admin session/token available on this external backend), so no 202 or summary line is quoted; workListMs not yet measured. The 08:36 log line (`processed=40 located=0 noMatch=0 errors=40 remaining=397`) is from the previous version.

## Brief 19c — Nominatim → Photon (golf-course search)

- `_shared/geocodeGolfClub.ts` (new): Photon GET `q={name} {sub_country}&osm_tag=leisure:golf_course&limit=5&lang=en`, UA `clbhouz/1.0 (https://www.clbhouz.co.uk)`, 8 s timeout (AbortController). `pickPhotonGolf`: leisure/golf_course only, first whose state/county/country equals sub_country (trimmed, case-insensitive), coords from `[lng, lat]`, no town fallback. Result: match | noMatch | httpError{status|message} | blocked{403/429}.
- `_shared/pickGolfResult.ts` deleted (no importers remain).
- `geocode-played-clubs`: loop moved to `batch.ts` (injected I/O); `blocked` ends the run, stamps nothing, logs `stopReason=blocked status=N`. 202/waitUntil, 100 s/40 budget, null-only coordinate writes, stamp rules and 30-day window unchanged.
- `geocode-club`: logic in `handler.ts`; uses geocodeGolfClub; same `{latitude, longitude, cached}` / 404 / 502 shapes. Coordinate write is now conditional on both being null (previously unconditional, per brief). No client change.
- Attribution "Locations © OpenStreetMap contributors" (9.5px, A.FAINT, 400, nowrap, ellipsis): CoursesMapSection under the legend when the plot shows; WhereItIs under the map when `osmAttribution` is set — CourseAboutTab sets it when the course row lacks its own latitude/longitude (i.e. coords came from the club fallback).

### Test edits
- `src/test/geocodePlayedClubs.test.ts:2` import `pickGolfResult` → `pickPhotonGolf`.
- `:5-6` Nominatim `town`/`golf` fixtures → Photon `feat()` builder.
- `:8-21` the four `pickGolfResult` cases (golf wins over town; display_name contains sub_country; otherwise null; empty null) → four `pickPhotonGolf` cases (state match; country match; other state no match; non-golf ignored + empty list no match). The other 4 tests in the file are unchanged; file stays at 8 tests.
- New `src/test/geocodeGolfClub.test.ts` (6): 403/429 blocked, 500 httpError, timeout httpError, batch blocked stops and stamps nothing, geocode-club match → `{latitude, longitude, cached:false}`.

| Shard | Files | Tests |
|---|---|---|
| 1/4 | 226 | 2,507 |
| 2/4 | 226 | 2,502 |
| 3/4 | 226 | 2,610 |
| 4/4 | 225 | 2,835 |
| **Total** | **903** | **10,454** |

Delta vs 10,448 / 902: +6 tests, +1 file (geocodeGolfClub.test.ts). No timeouts, no reruns.

### Deploy / verify
Both functions deployed. The agent cannot read INTERNAL_FN_SECRET or hold an admin session, so no authenticated run was made and no summary line is quoted — Ben to trigger. Photon answered HTTP 200 to the same query shape from the sandbox (not from the edge runtime).

### Captures (fixture with real components, removed)
`c-map-390.png`, `c-map-320.png`, `c-where-390.png`, `c-where-320.png`. Attribution line scrollWidth = clientWidth at both widths; document width = viewport (no overflow).
